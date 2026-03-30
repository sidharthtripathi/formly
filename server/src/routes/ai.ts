import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";

const router = Router();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  baseURL: process.env.ANTHROPIC_BASE_URL,
});

function extractTextDelta(chunk: any): string | null {
  if (chunk.type === "content_block_delta" && chunk.delta?.type === "text_delta") {
    return chunk.delta.text;
  }
  if (typeof chunk.text === "string") {
    return chunk.text;
  }
  return null;
}

// GET /api/ai/generate - Generate form from prompt (SSE)
// Note: Uses GET because EventSource only supports GET
router.get("/generate", async (req, res) => {
  const prompt = req.query.prompt as string;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
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

    for await (const chunk of stream) {
      const text = extractTextDelta(chunk);
      if (text) {
        res.write(`event: schema_delta\ndata: ${JSON.stringify({ text })}\n\n`);
        res.flush();
      }
    }

    res.write("event: done\ndata: {}\n\n");
    res.end();
  } catch (error) {
    console.error("AI generate error:", error);
    res.write(`event: error\ndata: ${JSON.stringify({ error: "Generation failed" })}\n\n`);
    res.end();
  }
});

// POST /api/ai/modify - Modify existing form (SSE)
router.post("/modify", async (req, res) => {
  const { prompt, currentSchema, selectedFieldId } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
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
        res.flush();
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
