import { Router } from "express";
import { db, forms } from "../db/index.js";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { AuthRequest } from "../middleware/auth.js";

export const formsRouter = Router();

// POST /api/forms - Create form
formsRouter.post("/", async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [form] = await db
      .insert(forms)
      .values({
        ownerId: user.id,
        title: req.body.title,
        description: req.body.description,
        schema: req.body.schema,
      })
      .returning();

    return res.status(201).json({ data: form });
  } catch (error) {
    console.error("Create form error:", error);
    return res.status(500).json({ error: "Failed to create form" });
  }
});

// GET /api/forms - List user's forms
formsRouter.get("/", async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userForms = await db.query.forms.findMany({
      where: eq(forms.ownerId, user.id),
      orderBy: [desc(forms.updatedAt)],
    });

    return res.json({ data: userForms });
  } catch (error) {
    console.error("List forms error:", error);
    return res.status(500).json({ error: "Failed to list forms" });
  }
});

// GET /api/forms/:id - Get single form
formsRouter.get("/:id", async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const form = await db.query.forms.findFirst({
      where: eq(forms.id, req.params.id),
    });

    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    if (form.ownerId !== user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    return res.json({ data: form });
  } catch (error) {
    console.error("Get form error:", error);
    return res.status(500).json({ error: "Failed to get form" });
  }
});

// PATCH /api/forms/:id - Update form
formsRouter.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const existing = await db.query.forms.findFirst({
      where: eq(forms.id, req.params.id),
    });

    if (!existing) {
      return res.status(404).json({ error: "Form not found" });
    }

    if (existing.ownerId !== user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const [updated] = await db
      .update(forms)
      .set({
        title: req.body.title,
        description: req.body.description,
        schema: req.body.schema,
        updatedAt: new Date(),
      })
      .where(eq(forms.id, req.params.id))
      .returning();

    return res.json({ data: updated });
  } catch (error) {
    console.error("Update form error:", error);
    return res.status(500).json({ error: "Failed to update form" });
  }
});

// DELETE /api/forms/:id - Delete form
formsRouter.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const existing = await db.query.forms.findFirst({
      where: eq(forms.id, req.params.id),
    });

    if (!existing) {
      return res.status(404).json({ error: "Form not found" });
    }

    if (existing.ownerId !== user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await db.delete(forms).where(eq(forms.id, req.params.id));
    return res.json({ success: true });
  } catch (error) {
    console.error("Delete form error:", error);
    return res.status(500).json({ error: "Failed to delete form" });
  }
});

// POST /api/forms/:id/publish - Publish form
formsRouter.post("/:id/publish", async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const existing = await db.query.forms.findFirst({
      where: eq(forms.id, req.params.id),
    });

    if (!existing) {
      return res.status(404).json({ error: "Form not found" });
    }

    if (existing.ownerId !== user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const slug = `${req.params.id.slice(0, 8)}-${randomUUID().split('-')[0]}`;

    const [published] = await db
      .update(forms)
      .set({
        isPublished: true,
        status: "published",
        publicSlug: slug,
        updatedAt: new Date(),
      })
      .where(eq(forms.id, req.params.id))
      .returning();

    return res.json({ data: published });
  } catch (error) {
    console.error("Publish form error:", error);
    return res.status(500).json({ error: "Failed to publish form" });
  }
});

// GET /api/forms/public/:slug - Get public form by slug (public, no auth)
formsRouter.get("/:slug", async (req, res) => {
  try {
    const form = await db.query.forms.findFirst({
      where: eq(forms.publicSlug, req.params.slug),
    });

    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    return res.json({ data: form });
  } catch (error) {
    console.error("Get public form error:", error);
    return res.status(500).json({ error: "Failed to get form" });
  }
});
