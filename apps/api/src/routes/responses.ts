import { Elysia } from "elysia";
import { db } from "../db";
import { responses, forms } from "../db/schema";
import { eq, desc } from "drizzle-orm";

export const responses = new Elysia()
  .post("/api/forms/:id/responses", async ({ params, body }) => {
    const form = await db.query.forms.findFirst({
      where: eq(forms.id, params.id),
    });
    if (!form || !form.isPublished) {
      return { error: "Form not found or not published" };
    }

    const [response] = await db
      .insert(responses)
      .values({
        formId: params.id,
        answers: body.answers,
        metadata: body.metadata,
        respondentId: body.respondentId || null,
      })
      .returning();
    return { data: response };
  })
  .get("/api/forms/:id/responses", async ({ params, query, store, error }) => {
    const user = store.user as { id: string };

    const form = await db.query.forms.findFirst({
      where: eq(forms.id, params.id),
    });
    if (!form) return error(404, "Form not found");
    if (form.ownerId !== user.id) return error(403, "Forbidden");

    const page = parseInt(query?.page as string) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    const formResponses = await db.query.responses.findMany({
      where: eq(responses.formId, params.id),
      orderBy: [desc(responses.submittedAt)],
      limit,
      offset,
    });

    return { data: formResponses, page, limit };
  })
  .get("/api/forms/:id/responses/export", async ({ params, store, error }) => {
    const user = store.user as { id: string };

    const form = await db.query.forms.findFirst({
      where: eq(forms.id, params.id),
    });
    if (!form) return error(404, "Form not found");
    if (form.ownerId !== user.id) return error(403, "Forbidden");

    const formResponses = await db.query.responses.findMany({
      where: eq(responses.formId, params.id),
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

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="responses-${params.id}.csv"`,
      },
    });
  });
