import { Elysia } from "elysia";

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export const rateLimit = new Elysia().onBeforeHandle(({ request, set }) => {
  if (request.url.includes("/api/")) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("cf-connecting-ip") ||
      "unknown";

    const now = Date.now();
    const record = rateLimitStore.get(ip);

    if (!record || now > record.resetAt) {
      rateLimitStore.set(ip, { count: 1, resetAt: now + 60000 });
      return;
    }

    if (record.count >= 100) {
      set.status = 429;
      return { error: "Rate limit exceeded" };
    }

    record.count++;
  }
});
