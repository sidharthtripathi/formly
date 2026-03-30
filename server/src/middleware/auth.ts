import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db, users } from "../db/index.js";
import { eq } from "drizzle-orm";

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
  "/api/ai/generate",
  "/api/ai/modify",
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

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const pathname = req.path;

  // Skip auth for public paths
  if (isPublicPath(pathname)) {
    next();
    return;
  }

  // Check for X-User-Id header (set by frontend authedFetch)
  const userId = req.headers["x-user-id"] as string | undefined;
  if (userId) {
    try {
      const dbUser = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (dbUser) {
        req.user = {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          avatarUrl: dbUser.avatarUrl,
        };
        next();
        return;
      }
    } catch (error) {
      console.error("Auth DB error:", error);
    }
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
