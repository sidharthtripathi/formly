import { Request, Response, NextFunction } from "express";

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100;

export function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Only rate limit API routes
  if (!req.path.includes("/api/")) {
    next();
    return;
  }

  const ip =
    req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
    req.headers["cf-connecting-ip"]?.toString() ||
    req.socket.remoteAddress ||
    "unknown";

  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    next();
    return;
  }

  if (record.count >= MAX_REQUESTS) {
    res.status(429).json({
      error: "Rate limit exceeded",
      retryAfter: Math.ceil((record.resetAt - now) / 1000),
    });
    return;
  }

  record.count++;
  next();
}

// Cleanup old entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(ip);
    }
  }
}, 5 * 60 * 1000);
