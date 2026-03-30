import type { ElysiaContext } from "elysia";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema";

const sql = postgres(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true },
  baseURL: process.env.BETTER_AUTH_URL || process.env.API_URL || "http://localhost:3001",
});

export async function validateSession(token: string) {
  if (!token) return null;
  try {
    const session = await auth.api.getSession({
      headers: new Headers({ authorization: `Bearer ${token}` }),
    });
    return session;
  } catch {
    return null;
  }
}

const PUBLIC_PATHS = [
  "/health",
  "/api/forms/public",
  "/api/forms/:id/responses",
  "/api/ai/generate",
  "/api/ai/modify",
  "/api/stripe/webhook",
];

function isPublicPath(url: string): boolean {
  return PUBLIC_PATHS.some((path) => {
    if (path.includes(":")) {
      const pattern = path.replace(/:\w+/g, "[^/]+");
      return new RegExp(`^${pattern}$`).test(url);
    }
    return url.includes(path);
  });
}

export interface AuthContext {
  user?: {
    id: string;
    email: string;
    name?: string;
    avatarUrl?: string;
  };
}

export const authMiddleware = async (context: ElysiaContext & { store: AuthContext }) => {
  const request = context.request;
  if (!request?.url) return;

  const url = request.url.replace(/^.*:\d+/, "");

  if (isPublicPath(url)) return;

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    context.error(401, "Unauthorized");
    return;
  }

  const token = authHeader.slice(7);
  const session = await validateSession(token);

  if (!session) {
    context.error(401, "Invalid or expired session");
    return;
  }

  context.store.user = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    avatarUrl: session.user.image,
  };
};
