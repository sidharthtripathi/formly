import { Elysia } from "elysia";
import { db } from "../db";
import { webhooks, forms } from "../db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const webhookEventTypes = [
  "form.submission.created",
  "form.submission.updated",
  "form.published",
  "form.closed",
] as const;

const createWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum(webhookEventTypes)),
  secret: z.string().optional(),
  formId: z.string().uuid().optional(), // If undefined, triggers for all forms
});

const sendWebhookSchema = z.object({
  url: z.string().url(),
  event: z.enum(webhookEventTypes),
  payload: z.any(),
  secret: z.string().optional(),
});

async function sendWebhook(payload: { url: string; event: string; data: any; secret?: string }) {
  const body = JSON.stringify({
    event: payload.event,
    timestamp: new Date().toISOString(),
    data: payload.data,
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (payload.secret) {
    const crypto = await import("crypto");
    const signature = crypto
      .createHmac("sha256", payload.secret)
      .update(body)
      .digest("hex");
    headers["X-Formly-Signature"] = signature;
  }

  try {
    await fetch(payload.url, {
      method: "POST",
      headers,
      body,
    });
  } catch (error) {
    console.error(`Webhook delivery failed to ${payload.url}:`, error);
  }
}

export const webhooksRoutes = new Elysia()
  .post("/api/webhooks", async ({ body, store }) => {
    const user = store.user as { id: string };

    const [webhook] = await db
      .insert(webhooks)
      .values({
        ownerId: user.id,
        url: body.url,
        events: body.events,
        secret: body.secret || crypto.randomUUID(),
        formId: body.formId || null,
      })
      .returning();

    return { data: webhook };
  })
  .get("/api/webhooks", async ({ store }) => {
    const user = store.user as { id: string };

    const userWebhooks = await db.query.webhooks.findMany({
      where: eq(webhooks.ownerId, user.id),
    });

    return { data: userWebhooks };
  })
  .delete("/api/webhooks/:id", async ({ params }) => {
    await db.delete(webhooks).where(eq(webhooks.id, params.id));
    return { success: true };
  })
  .post("/api/webhooks/:id/test", async ({ params }) => {
    const webhook = await db.query.webhooks.findFirst({
      where: eq(webhooks.id, params.id),
    });

    if (!webhook) {
      return { error: "Webhook not found" };
    }

    await sendWebhook({
      url: webhook.url,
      event: "form.submission.created",
      data: { test: true, message: "This is a test webhook" },
      secret: webhook.secret || undefined,
    });

    return { success: true };
  });
