import { Elysia } from "elysia";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const client = new Anthropic({
  apiKey: process.env.MINIMAX_API_KEY!,
  baseURL: process.env.MINIMAX_BASE_URL,
});

const generateSchema = z.object({
  prompt: z.string(),
});

export const ai = new Elysia()
  .post("/api/ai/generate", async ({ body, set }) => {
    set.headers["Content-Type"] = "text/event-stream";
    set.headers["Cache-Control"] = "no-cache";

    const stream = await client.messages.stream({
      model: "minimax-m2.7",
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
      messages: [{ role: "user", content: body.prompt }],
    });

    return new Response(
      new ReadableStream({
        async start(controller) {
          for await (const chunk of stream) {
            controller.enqueue(`data: ${JSON.stringify(chunk)}\n\n`);
          }
          controller.enqueue("event: done\ndata: {}\n\n");
          controller.close();
        },
      }),
      { headers: set.headers }
    );
  })
  .post("/api/ai/modify", async ({ body, set }) => {
    set.headers["Content-Type"] = "text/event-stream";
    set.headers["Cache-Control"] = "no-cache";

    const { prompt, currentSchema, selectedFieldId } = body;

    const stream = await client.messages.stream({
      model: "minimax-m2.7",
      max_tokens: 4096,
      system: `You are Formly's AI form editor. The user wants to modify an existing form.
Rules:
- Return the complete updated FormSchema
- If the user has tagged a specific field (@fieldname), only modify that field unless explicitly told to change others
- Preserve all existing field IDs unless adding/removing fields
- Preserve existing validation, conditions, and settings unless asked to change them
- Output ONLY the updated JSON object`,
      messages: [
        { role: "user", content: `Current form schema: ${JSON.stringify(currentSchema)}` },
        { role: "user", content: `Selected field (if any): ${selectedFieldId || "none"}` },
        { role: "user", content: `User request: ${prompt}` },
      ],
    });

    return new Response(
      new ReadableStream({
        async start(controller) {
          for await (const chunk of stream) {
            controller.enqueue(`data: ${JSON.stringify(chunk)}\n\n`);
          }
          controller.enqueue("event: done\ndata: {}\n\n");
          controller.close();
        },
      }),
      { headers: set.headers }
    );
  });
