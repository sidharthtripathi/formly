import { Router } from "express";
import { db, users } from "../db/index.js";
import { eq } from "drizzle-orm";
import { AuthRequest } from "../middleware/auth.js";

export const usersRouter = Router();

// GET /api/users/me - Get current user
usersRouter.get("/me", async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    if (!dbUser) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      data: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        image: dbUser.avatarUrl,
        plan: dbUser.plan,
        createdAt: dbUser.createdAt,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({ error: "Failed to get user" });
  }
});

// GET /api/users/me/credits - Get AI credit status
usersRouter.get("/me/credits", async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    if (!dbUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const now = new Date();
    const resetDate = new Date(dbUser.aiCreditsResetAt);

    // Reset credits if past reset date - persist to database
    if (now >= resetDate) {
      const newResetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      await db
        .update(users)
        .set({
          aiCreditsUsed: 0,
          aiCreditsResetAt: newResetDate,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      return res.json({
        used: 0,
        limit: dbUser.plan === "pro" ? -1 : 20,
        resetsAt: newResetDate,
      });
    }

    return res.json({
      used: dbUser.aiCreditsUsed,
      limit: dbUser.plan === "pro" ? -1 : 20,
      resetsAt: resetDate,
    });
  } catch (error) {
    console.error("Get credits error:", error);
    return res.status(500).json({ error: "Failed to get credits" });
  }
});
