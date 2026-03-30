import { Router } from "express";
import { db, responses, forms } from "../db/index.js";
import { eq, desc } from "drizzle-orm";
import { AuthRequest } from "../middleware/auth.js";

export const responsesRouter = Router();

// POST /api/forms/:id/responses - Submit form response (public)
responsesRouter.post("/:id/responses", async (req, res) => {
  try {
    const form = await db.query.forms.findFirst({
      where: eq(forms.id, req.params.id),
    });

    if (!form || !form.isPublished) {
      return res.status(404).json({ error: "Form not found or not published" });
    }

    const [response] = await db
      .insert(responses)
      .values({
        formId: req.params.id,
        answers: req.body.answers,
        metadata: req.body.metadata,
        respondentId: req.body.respondentId || null,
      })
      .returning();

    return res.status(201).json({ data: response });
  } catch (error) {
    console.error("Submit response error:", error);
    return res.status(500).json({ error: "Failed to submit response" });
  }
});

// GET /api/forms/:id/responses - List responses (protected)
responsesRouter.get("/:id/responses", async (req: AuthRequest, res) => {
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

    const page = parseInt(req.query?.page as string) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    const formResponses = await db.query.responses.findMany({
      where: eq(responses.formId, req.params.id),
      orderBy: [desc(responses.submittedAt)],
      limit,
      offset,
    });

    return res.json({ data: formResponses, page, limit });
  } catch (error) {
    console.error("List responses error:", error);
    return res.status(500).json({ error: "Failed to list responses" });
  }
});

// GET /api/forms/:id/responses/export - Export CSV (protected)
responsesRouter.get("/:id/responses/export", async (req: AuthRequest, res) => {
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

    const formResponses = await db.query.responses.findMany({
      where: eq(responses.formId, req.params.id),
      orderBy: [desc(responses.submittedAt)],
    });

    const schemaFields = (form.schema as any)?.fields || [];
    const headers = ["Submitted At", ...schemaFields.map((f: any) => f.label)];
    const rows = formResponses.map((r: any) => [
      r.submittedAt,
      ...schemaFields.map((f: any) => r.answers?.[f.id] || ""),
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="responses-${req.params.id}.csv"`);
    return res.send(csv);
  } catch (error) {
    console.error("Export responses error:", error);
    return res.status(500).json({ error: "Failed to export responses" });
  }
});
