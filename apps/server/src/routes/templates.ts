import { Router } from "express";
import { db, templates, forms } from "../db/index.js";
import { eq } from "drizzle-orm";
import { AuthRequest } from "../middleware/auth.js";

export const templatesRouter = Router();

// GET /api/templates - List user's templates
templatesRouter.get("/", async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userTemplates = await db.query.templates.findMany({
      where: eq(templates.ownerId, user.id),
    });

    return res.json({ data: userTemplates });
  } catch (error) {
    console.error("List templates error:", error);
    return res.status(500).json({ error: "Failed to list templates" });
  }
});

// POST /api/templates - Create template
templatesRouter.post("/", async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [template] = await db
      .insert(templates)
      .values({
        ownerId: user.id,
        title: req.body.title,
        description: req.body.description,
        schema: req.body.schema,
        isPublic: req.body.isPublic || false,
      })
      .returning();

    return res.status(201).json({ data: template });
  } catch (error) {
    console.error("Create template error:", error);
    return res.status(500).json({ error: "Failed to create template" });
  }
});

// DELETE /api/templates/:id - Delete template
templatesRouter.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const existing = await db.query.templates.findFirst({
      where: eq(templates.id, req.params.id),
    });

    if (!existing) {
      return res.status(404).json({ error: "Template not found" });
    }

    if (existing.ownerId !== user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await db.delete(templates).where(eq(templates.id, req.params.id));
    return res.json({ success: true });
  } catch (error) {
    console.error("Delete template error:", error);
    return res.status(500).json({ error: "Failed to delete template" });
  }
});

// POST /api/templates/:id/use - Create form from template
templatesRouter.post("/:id/use", async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const template = await db.query.templates.findFirst({
      where: eq(templates.id, req.params.id),
    });

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    const [newForm] = await db
      .insert(forms)
      .values({
        ownerId: user.id,
        title: template.title,
        description: template.description,
        schema: template.schema,
      })
      .returning();

    return res.status(201).json({ data: newForm });
  } catch (error) {
    console.error("Use template error:", error);
    return res.status(500).json({ error: "Failed to create form from template" });
  }
});
