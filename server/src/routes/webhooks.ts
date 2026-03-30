import { Router } from "express";
import { db, webhooks, forms } from "../db/index.js";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth.js";

const router = Router();

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
  formId: z.string().uuid().optional(),
});

// Blocked IP ranges for SSRF protection
const BLOCKED_IP_RANGES = [
  "127.0.0.0/8",
  "10.0.0.0/8",
  "172.16.0.0/12",
  "192.168.0.0/16",
  "169.254.0.0/16",
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

    // Block IP addresses
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(hostname)) {
      const parts = hostname.split(".").map(Number);
      if (parts[0] === 127) return true;
      if (parts[0] === 0) return true;
    }

    // Block localhost variations
    if (hostname === "localhost" || hostname === "::1" || hostname === "[::1]") {
      return true;
    }

    // Block numeric IP addresses
    const numericMatch = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
    if (numericMatch) {
      const firstOctet = parseInt(numericMatch[1]);
      if (firstOctet === 127) return true;
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
    return true;
  }
}

async function sendWebhook(payload: {
  url: string;
  event: string;
  data: unknown;
  secret?: string;
}): Promise<void> {
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

  const response = await fetch(payload.url, {
    method: "POST",
    headers,
    body,
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Webhook delivery failed: ${response.status}`);
  }
}

// GET /api/webhooks - List user's webhooks
router.get("/", async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userWebhooks = await db.query.webhooks.findMany({
      where: eq(webhooks.ownerId, user.id),
    });

    return res.json({ data: userWebhooks });
  } catch (error) {
    console.error("List webhooks error:", error);
    return res.status(500).json({ error: "Failed to list webhooks" });
  }
});

// POST /api/webhooks - Create webhook
router.post("/", async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const parsed = createWebhookSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid webhook data", details: parsed.error });
    }

    const { url, events, secret, formId } = parsed.data;

    const [webhook] = await db
      .insert(webhooks)
      .values({
        ownerId: user.id,
        url,
        events,
        secret: secret || crypto.randomUUID(),
        formId: formId || null,
      })
      .returning();

    return res.status(201).json({ data: webhook });
  } catch (error) {
    console.error("Create webhook error:", error);
    return res.status(500).json({ error: "Failed to create webhook" });
  }
});

// DELETE /api/webhooks/:id - Delete webhook
router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const existing = await db.query.webhooks.findFirst({
      where: eq(webhooks.id, req.params.id),
    });

    if (!existing) {
      return res.status(404).json({ error: "Webhook not found" });
    }

    if (existing.ownerId !== user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await db.delete(webhooks).where(eq(webhooks.id, req.params.id));
    return res.json({ success: true });
  } catch (error) {
    console.error("Delete webhook error:", error);
    return res.status(500).json({ error: "Failed to delete webhook" });
  }
});

// POST /api/webhooks/:id/test - Test webhook
router.post("/:id/test", async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const webhook = await db.query.webhooks.findFirst({
      where: eq(webhooks.id, req.params.id),
    });

    if (!webhook) {
      return res.status(404).json({ error: "Webhook not found" });
    }

    if (webhook.ownerId !== user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    try {
      await sendWebhook({
        url: webhook.url,
        event: "form.submission.created",
        data: { test: true, message: "This is a test webhook" },
        secret: webhook.secret || undefined,
      });
    } catch (e) {
      return res.status(400).json({ error: "Failed to send test webhook" });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("Test webhook error:", error);
    return res.status(500).json({ error: "Failed to test webhook" });
  }
});

export { router as webhooksRouter };
