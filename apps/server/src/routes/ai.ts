import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "../db/index.js";
import * as schema from "@formly/shared/db";
import { eq } from "drizzle-orm";
import { AuthRequest } from "../middleware/auth.js";

const users = schema.users;

const router: Router = Router();

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseURL: process.env.ANTHROPIC_BASE_URL,
    })
  : null;

const AI_CREDIT_LIMIT = 20;

interface StreamField {
  id: string;
  type: string;
  label: string;
  [key: string]: unknown;
}

// Check and decrement credits for a user
async function checkAndDecrementCredits(userId: string): Promise<{ allowed: boolean; error?: string; creditsUsed?: number; limit?: number }> {
  const dbUserResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const dbUser = dbUserResult[0];

  if (!dbUser) {
    return { allowed: false, error: "User not found" };
  }

  // Pro users have unlimited credits
  if (dbUser.plan === "pro") {
    return { allowed: true, creditsUsed: dbUser.aiCreditsUsed, limit: -1 };
  }

  // Check if credits are exhausted
  if (dbUser.aiCreditsUsed >= AI_CREDIT_LIMIT) {
    return {
      allowed: false,
      error: "AI credits exhausted. Please upgrade to Pro or wait for reset.",
      creditsUsed: dbUser.aiCreditsUsed,
      limit: AI_CREDIT_LIMIT,
    };
  }

  // Decrement credits
  await db
    .update(users)
    .set({
      aiCreditsUsed: dbUser.aiCreditsUsed + 1,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return {
    allowed: true,
    creditsUsed: dbUser.aiCreditsUsed + 1,
    limit: AI_CREDIT_LIMIT,
  };
}

function extractTextDelta(chunk: any): string | null {
  if (chunk.type === "content_block_delta" && chunk.delta?.type === "text_delta") {
    return chunk.delta.text;
  }
  if (typeof chunk.text === "string") {
    return chunk.text;
  }
  return null;
}

// Parse accumulated text to find complete field objects
function extractCompletedFields(
  accumulatedText: string,
  lastProcessedIndex: number
): { fields: StreamField[]; newIndex: number } {
  const fields: StreamField[] = [];
  let newIndex = lastProcessedIndex;

  const fieldsStart = accumulatedText.indexOf('"fields":');
  if (fieldsStart === -1 || fieldsStart < lastProcessedIndex) {
    return { fields: [], newIndex };
  }

  const scanText = accumulatedText.slice(fieldsStart);
  let braceCount = 0;
  let fieldStart = -1;
  let inField = false;

  for (let i = 0; i < scanText.length; i++) {
    const char = scanText[i];

    if (char === '{' && !inField) {
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
          const fieldStr = scanText.slice(fieldStart, i + 1);
          try {
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
router.get("/generate", async (req: AuthRequest, res) => {
  const prompt = req.query.prompt as string;
  const userId = req.user?.id;

  // Return auth error via SSE
  if (!userId) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Accel-Buffering", "no");
    res.write(`event: error\ndata: ${JSON.stringify({ error: "Unauthorized" })}\n\n`);
    res.end();
    return;
  }

  if (!prompt) {
    res.status(400).json({ error: "Prompt is required" });
    return;
  }

  if (!client) {
    res.status(500).json({ error: "AI service not configured" });
    return;
  }

  // Check and decrement credits
  const creditCheck = await checkAndDecrementCredits(userId);
  if (!creditCheck.allowed) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Accel-Buffering", "no");
    res.write(`event: error\ndata: ${JSON.stringify({ error: creditCheck.error, credits: { used: creditCheck.creditsUsed, limit: creditCheck.limit } })}\n\n`);
    res.end();
    return;
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

        res.write(
          `event: schema_delta\ndata: ${JSON.stringify({ text })}\n\n`
        );

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

        if (!sentInitialMeta) {
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
router.post("/modify", async (req: AuthRequest, res) => {
  const { prompt, currentSchema, selectedFieldId } = req.body;
  const userId = req.user?.id;

  // Return auth error via SSE
  if (!userId) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Accel-Buffering", "no");
    res.write(`event: error\ndata: ${JSON.stringify({ error: "Unauthorized" })}\n\n`);
    res.end();
    return;
  }

  if (!prompt) {
    res.status(400).json({ error: "Prompt is required" });
    return;
  }

  if (!client) {
    res.status(500).json({ error: "AI service not configured" });
    return;
  }

  // Check and decrement credits
  const creditCheck = await checkAndDecrementCredits(userId);
  if (!creditCheck.allowed) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Accel-Buffering", "no");
    res.write(`event: error\ndata: ${JSON.stringify({ error: creditCheck.error, credits: { used: creditCheck.creditsUsed, limit: creditCheck.limit } })}\n\n`);
    res.end();
    return;
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
