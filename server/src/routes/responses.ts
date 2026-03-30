import { Router } from "express";
import { db, responses, forms } from "../db/index.js";
import { eq, desc } from "drizzle-orm";
import { AuthRequest } from "../middleware/auth.js";

export const responsesRouter = Router();

// POST /api/forms/:id/responses - Submit form response (public)
// This route is mounted at /api/forms/:id/responses in index.ts
responsesRouter.post("/", async (req, res) => {
  try {
    // The formId comes from the parent router's :id parameter
    const formId = req.params.id;
    if (!formId) {
      return res.status(400).json({ error: "Form ID required" });
    }

    const form = await db.query.forms.findFirst({
      where: eq(forms.id, formId),
    });

    if (!form || !form.isPublished) {
      return res.status(404).json({ error: "Form not found or not published" });
    }

    if (!req.body.answers || typeof req.body.answers !== "object") {
      return res.status(400).json({ error: "Answers are required" });
    }

    const [response] = await db
      .insert(responses)
      .values({
        formId: formId,
        answers: req.body.answers,
        metadata: req.body.metadata || {},
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
responsesRouter.get("/", async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const formId = req.params.id;
    if (!formId) {
      return res.status(400).json({ error: "Form ID required" });
    }

    const form = await db.query.forms.findFirst({
      where: eq(forms.id, formId),
    });

    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    if (form.ownerId !== user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const page = parseInt(req.query?.page as string) || 1;
    if (isNaN(page) || page < 1) {
      return res.status(400).json({ error: "Invalid page parameter" });
    }

    const limit = 20;
    const offset = (page - 1) * limit;

    const formResponses = await db.query.responses.findMany({
      where: eq(responses.formId, formId),
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
responsesRouter.get("/export", async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const formId = req.params.id;
    if (!formId) {
      return res.status(400).json({ error: "Form ID required" });
    }

    const form = await db.query.forms.findFirst({
      where: eq(forms.id, formId),
    });

    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    if (form.ownerId !== user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const formResponses = await db.query.responses.findMany({
      where: eq(responses.formId, formId),
      orderBy: [desc(responses.submittedAt)],
    });

    const schemaFields = (form.schema as Record<string, unknown>)?.fields as Array<{ id: string; label: string }> || [];
    const headers = ["Submitted At", ...schemaFields.map((f) => f.label)];
    const rows = formResponses.map((r) => [
      r.submittedAt,
      ...schemaFields.map((f) => r.answers?.[f.id] || ""),
    ]);

    // Proper CSV escaping - wrap fields in quotes and escape internal quotes
    const escapeCSV = (cell: unknown): string => {
      const str = String(cell ?? "");
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="responses-${formId}.csv"`);
    return res.send(csv);
  } catch (error) {
    console.error("Export responses error:", error);
    return res.status(500).json({ error: "Failed to export responses" });
  }
});
