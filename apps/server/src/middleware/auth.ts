import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db, users } from "../db/index.js";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

const PUBLIC_PATHS = [
  "/health",
  "/api/forms/public",
  "/api/forms/:id/responses",
  "/webhooks/stripe",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => {
    if (path.includes(":")) {
      const pattern = path.replace(/:\w+/g, "[^/]+");
      return new RegExp(`^${pattern}$`).test(pathname);
    }
    return pathname.includes(path);
  });
}

// Validate user and attach to request
export async function validateUser(userId: string | undefined, req: AuthRequest): Promise<boolean> {
  if (!userId) return false;

  try {
    // Use select() instead of query API since query API requires relations setup
    const dbUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (dbUser && dbUser[0]) {
      req.user = {
        id: dbUser[0].id,
        email: dbUser[0].email,
        name: dbUser[0].name ?? undefined,
        avatarUrl: dbUser[0].avatarUrl ?? undefined,
      };
      return true;
    }
  } catch (error) {
    console.error("Auth DB error:", error);
  }
  return false;
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const pathname = req.path;

  // Debug: log auth details
  console.log("[Auth] pathname:", pathname);
  console.log("[Auth] X-User-Id header:", req.headers["x-user-id"]);
  console.log("[Auth] Authorization header:", req.headers.authorization?.substring(0, 20));

  // Skip auth for public paths
  if (isPublicPath(pathname)) {
    console.log("[Auth] Skipping - public path");
    next();
    return;
  }

  // Check for X-User-Id header (set by frontend authedFetch)
  const userId = req.headers["x-user-id"] as string | undefined;
  console.log("[Auth] Checking X-User-Id:", userId);
  if (userId && await validateUser(userId, req)) {
    console.log("[Auth] Validated via X-User-Id, user:", req.user?.id);
    next();
    return;
  }

  // For AI endpoints, also check query param userId (used by SSE EventSource)
  const queryUserId = req.query.userId as string | undefined;
  if (pathname.startsWith("/api/ai/") && queryUserId && await validateUser(queryUserId, req)) {
    next();
    return;
  }

  // Fallback to Bearer token validation
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized: No token provided" });
    return;
  }

  const token = authHeader.slice(7);
  const authSecret = process.env.AUTH_SECRET;

  if (!authSecret) {
    console.error("AUTH_SECRET is not configured");
    res.status(500).json({ error: "Server configuration error" });
    return;
  }

  try {
    const decoded = jwt.verify(token, authSecret) as AuthUser & { accessToken?: string };

    if (!decoded.id || !decoded.email) {
      res.status(401).json({ error: "Unauthorized: Invalid token" });
      return;
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      avatarUrl: decoded.avatarUrl,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: "Unauthorized: Token expired" });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: "Unauthorized: Invalid token" });
      return;
    }
    console.error("Auth error:", error);
    res.status(401).json({ error: "Unauthorized" });
  }
}
