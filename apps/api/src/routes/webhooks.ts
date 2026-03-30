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

// Blocked IP ranges for SSRF protection
const BLOCKED_IP_RANGES = [
  "127.0.0.0/8",
  "10.0.0.0/8",
  "172.16.0.0/12",
  "192.168.0.0/16",
  "169.254.0.0/16", // AWS metadata
  "0.0.0.0/8",
  "100.64.0.0/10",
  "192.0.0.0/24",
  "192.0.2.0/24",
  "198.51.100.0/24",
  "203.0.113.0/24",
  "224.0.0.0/4",
  "240.0.0.0/4",
];

function isBlockedUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);

    // Only allow HTTPS
    if (url.protocol !== "https:") return true;

    const hostname = url.hostname;

    // Block IP addresses (including IPv4-mapped IPv6)
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(hostname)) {
      const parts = hostname.split(".").map(Number);
      const ip = parts[0] * 256 ** 3 + parts[1] * 256 ** 2 + parts[2] * 256 + parts[3];
      // Block 127.x.x.x (loopback)
      if (parts[0] === 127) return true;
      // Block 0.x.x.x (current network)
      if (parts[0] === 0) return true;
    }

    // Block localhost variations
    if (hostname === "localhost" || hostname === "::1" || hostname === "[::1]") {
      return true;
    }

    // Block numeric IP addresses that could be internal
    const numericMatch = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
    if (numericMatch) {
      const firstOctet = parseInt(numericMatch[1]);
      // 127.x.x.x loopback
      if (firstOctet === 127) return true;
      // 0.x.x.x current network
      if (firstOctet === 0) return true;
    }

    // Known internal/cloud metadata hostnames
    if (
      hostname === "169.254.169.254" ||
      hostname.endsWith(".metadata.google.internal") ||
      hostname === "metadata.google.internal" ||
      hostname === "metadata.google.com"
    ) {
      return true;
    }

    return false;
  } catch {
    return true; // Invalid URLs are blocked
  }
}

async function sendWebhook(payload: { url: string; event: string; data: any; secret?: string }) {
  // Validate URL before making request
  if (isBlockedUrl(payload.url)) {
    throw new Error("URL is not allowed");
  }

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
      signal: AbortSignal.timeout(10000), // 10 second timeout
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
  .delete("/api/webhooks/:id", async ({ params, store, error }) => {
    const user = store.user as { id: string };
    const existing = await db.query.webhooks.findFirst({
      where: eq(webhooks.id, params.id),
    });
    if (!existing) return error(404, "Webhook not found");
    if (existing.ownerId !== user.id) return error(403, "Forbidden");
    await db.delete(webhooks).where(eq(webhooks.id, params.id));
    return { success: true };
  })
  .post("/api/webhooks/:id/test", async ({ params, store, error }) => {
    const user = store.user as { id: string };
    const webhook = await db.query.webhooks.findFirst({
      where: eq(webhooks.id, params.id),
    });

    if (!webhook) return error(404, "Webhook not found");
    if (webhook.ownerId !== user.id) return error(403, "Forbidden");

    try {
      await sendWebhook({
        url: webhook.url,
        event: "form.submission.created",
        data: { test: true, message: "This is a test webhook" },
        secret: webhook.secret || undefined,
      });
    } catch (e) {
      return { error: "Failed to send test webhook" };
    }

    return { success: true };
  });
