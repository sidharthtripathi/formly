import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";

const router = Router();

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseURL: process.env.ANTHROPIC_BASE_URL,
    })
  : null;

function extractTextDelta(chunk: any): string | null {
  if (chunk.type === "content_block_delta" && chunk.delta?.type === "text_delta") {
    return chunk.delta.text;
  }
  if (typeof chunk.text === "string") {
    return chunk.text;
  }
  return null;
}

interface StreamField {
  id: string;
  type: string;
  label: string;
  [key: string]: unknown;
}

// Parse accumulated text to find complete field objects
function extractCompletedFields(
  accumulatedText: string,
  lastProcessedIndex: number
): { fields: StreamField[]; newIndex: number } {
  const fields: StreamField[] = [];
  let newIndex = lastProcessedIndex;

  // Look for field objects: they start with {"id": and end with }
  // We scan for complete field objects that were added since lastProcessedIndex
  const fieldPattern = /\{"id":\s*"([^"]+)"[^}]*\}/g;
  let match;

  // Find the "fields": [ section
  const fieldsStart = accumulatedText.indexOf('"fields":');
  if (fieldsStart === -1 || fieldsStart < lastProcessedIndex) {
    return { fields: [], newIndex };
  }

  // Scan from fieldsStart onwards for complete field objects
  const scanText = accumulatedText.slice(fieldsStart);
  let currentPos = 0;
  let braceCount = 0;
  let fieldStart = -1;
  let inField = false;

  for (let i = 0; i < scanText.length; i++) {
    const char = scanText[i];

    if (char === '{' && !inField) {
      // Check if we're starting a field object
      const remaining = scanText.slice(i, i + 10);
      if (remaining.includes('"id":')) {
        fieldStart = i;
        inField = true;
        braceCount = 1;
      }
    } else if (inField) {
      if (char === '{') braceCount++;
      else if (char === '}') {
        braceCount--;
        if (braceCount === 0 && fieldStart !== -1) {
          // We have a complete field object
          const fieldStr = scanText.slice(fieldStart, i + 1);
          try {
            // Only process if this is a NEW complete field (not previously processed)
            const globalFieldStart = fieldsStart + fieldStart;
            if (globalFieldStart >= lastProcessedIndex) {
              const field = JSON.parse(fieldStr) as StreamField;
              if (field.id && field.type && field.label) {
                fields.push(field);
                newIndex = fieldsStart + i + 1;
              }
            }
          } catch {
            // Not valid JSON, might be partial - ignore
          }
          fieldStart = -1;
          inField = false;
        }
      }
    }
  }

  return { fields, newIndex };
}

// GET /api/ai/generate - Generate form from prompt (SSE)
// Note: Uses GET because EventSource only supports GET
router.get("/generate", async (req, res) => {
  const prompt = req.query.prompt as string;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  if (!client) {
    return res.status(500).json({ error: "AI service not configured" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    const stream = await client.messages.stream({
      model: "MiniMax-M2.7",
      max_tokens: 4096,
      system: `You are Formly's AI form designer. Your job is to generate a FormSchema JSON object based on the user's description.
Rules:
- Always output valid FormSchema JSON as defined in the schema spec
- Choose appropriate field types for each piece of data
- Add sensible validation, placeholders, and help text
- For multi-step forms, use page_break fields to separate pages
- Include conditional logic when it makes the form more intelligent
- Keep labels concise and user-friendly
- Required fields should be the minimum necessary
- Output ONLY the JSON object, no markdown, no explanation`,
      messages: [{ role: "user", content: prompt }],
    });

    let accumulatedText = "";
    let lastProcessedFieldIndex = 0;
    let sentInitialMeta = false;

    for await (const chunk of stream) {
      const text = extractTextDelta(chunk);
      if (text) {
        accumulatedText += text;

        // Send raw text for any partial content display
        res.write(
          `event: schema_delta\ndata: ${JSON.stringify({ text })}\n\n`
        );

        // Try to extract completed fields for real-time rendering
        const { fields, newIndex } =
          extractCompletedFields(accumulatedText, lastProcessedFieldIndex);

        if (fields.length > 0) {
          for (const field of fields) {
            res.write(
              `event: field_complete\ndata: ${JSON.stringify({ field })}\n\n`
            );
          }
          lastProcessedFieldIndex = newIndex;
        }

        // Send metadata (title, pages) as soon as we have it
        if (!sentInitialMeta) {
          // Try to extract title and pages from accumulated text
          const titleMatch = accumulatedText.match(/"title":\s*"([^"]*)"/);
          const pagesMatch = accumulatedText.match(/"pages":\s*\[([^\]]*)\]/);

          if (titleMatch || pagesMatch) {
            res.write(
              `event: meta\ndata: ${JSON.stringify({
                title: titleMatch ? titleMatch[1] : null,
                pages: pagesMatch ? pagesMatch[1] : null,
              })}\n\n`
            );
            sentInitialMeta = true;
          }
        }

        // @ts-expect-error flush exists at runtime but not in types
        res.flush?.();
      }
    }

    res.write("event: done\ndata: {}\n\n");
    res.end();
  } catch (error) {
    console.error("AI generate error:", error);
    res.write(
      `event: error\ndata: ${JSON.stringify({ error: "Generation failed" })}\n\n`
    );
    res.end();
  }
});

// POST /api/ai/modify - Modify existing form (SSE)
router.post("/modify", async (req, res) => {
  const { prompt, currentSchema, selectedFieldId } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  if (!client) {
    return res.status(500).json({ error: "AI service not configured" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    const messages = [
      { role: "user" as const, content: `Current form schema: ${JSON.stringify(currentSchema)}` },
    ];

    if (selectedFieldId) {
      messages.push({ role: "user" as const, content: `Selected field (if any): ${selectedFieldId}` });
    }

    messages.push({ role: "user" as const, content: `User request: ${prompt}` });

    const stream = await client.messages.stream({
      model: "MiniMax-M2.7",
      max_tokens: 4096,
      system: `You are Formly's AI form editor. The user wants to modify an existing form.
Rules:
- Return the complete updated FormSchema
- If the user has tagged a specific field (@fieldname), only modify that field unless explicitly told to change others
- Preserve all existing field IDs unless adding/removing fields
- Preserve existing validation, conditions, and settings unless asked to change them
- Output ONLY the updated JSON object`,
      messages,
    });

    for await (const chunk of stream) {
      const text = extractTextDelta(chunk);
      if (text) {
        res.write(`event: schema_delta\ndata: ${JSON.stringify({ text })}\n\n`);
        // @ts-expect-error flush exists at runtime but not in types
        res.flush?.();
      }
    }

    res.write("event: done\ndata: {}\n\n");
    res.end();
  } catch (error) {
    console.error("AI modify error:", error);
    res.write(`event: error\ndata: ${JSON.stringify({ error: "Modification failed" })}\n\n`);
    res.end();
  }
});

export { router as aiRouter };
