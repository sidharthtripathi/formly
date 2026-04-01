import { Router } from "express";
import { prisma } from "../db/index.js";
import { randomUUID } from "crypto";
import { AuthRequest } from "../middleware/auth.js";

export const formsRouter: Router = Router();

// POST /api/forms - Create form
formsRouter.post("/", async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const form = await prisma.form.create({
      data: {
        ownerId: user.id,
        title: req.body.title,
        description: req.body.description,
        schema: req.body.schema,
      },
    });

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

    const userForms = await prisma.form.findMany({
      where: { ownerId: user.id },
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

    const form = await prisma.form.findUnique({
      where: { id: req.params.id },
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

    const existing = await prisma.form.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: "Form not found" });
    }

    if (existing.ownerId !== user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const updated = await prisma.form.update({
      where: { id: req.params.id },
      data: {
        title: req.body.title,
        description: req.body.description,
        schema: req.body.schema,
      },
    });

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

    const existing = await prisma.form.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: "Form not found" });
    }

    if (existing.ownerId !== user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await prisma.form.delete({
      where: { id: req.params.id },
    });
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

    const existing = await prisma.form.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: "Form not found" });
    }

    if (existing.ownerId !== user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const slug = `${req.params.id.slice(0, 8)}-${randomUUID().split('-')[0]}`;

    const published = await prisma.form.update({
      where: { id: req.params.id },
      data: {
        isPublished: true,
        status: "published",
        publicSlug: slug,
      },
    });

    return res.json({ data: published });
  } catch (error) {
    console.error("Publish form error:", error);
    return res.status(500).json({ error: "Failed to publish form" });
  }
});

// GET /api/forms/public/:slug - Get public form by slug (public, no auth)
formsRouter.get("/public/:slug", async (req, res) => {
  try {
    const form = await prisma.form.findUnique({
      where: { publicSlug: req.params.slug },
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