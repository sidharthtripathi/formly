import { Router } from "express";
import { prisma } from "../db/index.js";
import { AuthRequest } from "../middleware/auth.js";

export const templatesRouter: Router = Router();

// GET /api/templates - List user's templates
templatesRouter.get("/", async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userTemplates = await prisma.template.findMany({
      where: { ownerId: user.id },
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

    const template = await prisma.template.create({
      data: {
        ownerId: user.id,
        title: req.body.title,
        description: req.body.description,
        schema: req.body.schema,
        isPublic: req.body.isPublic || false,
      },
    });

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

    const existing = await prisma.template.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: "Template not found" });
    }

    if (existing.ownerId !== user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await prisma.template.delete({
      where: { id: req.params.id },
    });
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

    const template = await prisma.template.findUnique({
      where: { id: req.params.id },
    });

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    const newForm = await prisma.form.create({
      data: {
        ownerId: user.id,
        title: template.title,
        description: template.description,
        schema: template.schema,
      },
    });

    return res.status(201).json({ data: newForm });
  } catch (error) {
    console.error("Use template error:", error);
    return res.status(500).json({ error: "Failed to create form from template" });
  }
});