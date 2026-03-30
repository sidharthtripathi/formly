import { Elysia } from "elysia";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export const users = new Elysia()
  .get("/api/users/me", async ({ store }) => {
    const user = store.user as { id: string };
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });
    if (!dbUser) return { data: null };
    // Only return safe, non-sensitive fields
    return {
      data: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        image: dbUser.image,
        plan: dbUser.plan,
        createdAt: dbUser.createdAt,
      },
    };
  })
  .get("/api/users/me/credits", async ({ store }) => {
    const user = store.user as { id: string };
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    const now = new Date();
    const resetDate = new Date(dbUser!.aiCreditsResetAt);

    if (now >= resetDate) {
      return { used: 0, limit: 20, resetsAt: new Date(now.getFullYear(), now.getMonth() + 1, 1) };
    }

    return {
      used: dbUser!.aiCreditsUsed,
      limit: dbUser!.plan === "pro" ? -1 : 20,
      resetsAt: resetDate,
    };
  });
