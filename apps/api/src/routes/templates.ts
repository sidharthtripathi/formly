import { Elysia } from "elysia";
import { db } from "../db";
import { templates } from "../db/schema";
import { eq } from "drizzle-orm";

export const templates = new Elysia()
  .get("/api/templates", async ({ store }) => {
    const user = store.user as { id: string };
    const userTemplates = await db.query.templates.findMany({
      where: eq(templates.ownerId, user.id),
    });
    return { data: userTemplates };
  })
  .post("/api/templates", async ({ body, store }) => {
    const user = store.user as { id: string };
    const [template] = await db
      .insert(templates)
      .values({
        ownerId: user.id,
        title: body.title,
        description: body.description,
        schema: body.schema,
        isPublic: body.isPublic || false,
      })
      .returning();
    return { data: template };
  })
  .delete("/api/templates/:id", async ({ params, store, error }) => {
    const user = store.user as { id: string };
    const existing = await db.query.templates.findFirst({
      where: eq(templates.id, params.id),
    });
    if (!existing) return error(404, "Template not found");
    if (existing.ownerId !== user.id) return error(403, "Forbidden");
    await db.delete(templates).where(eq(templates.id, params.id));
    return { success: true };
  })
  .post("/api/templates/:id/use", async ({ params, store }) => {
    const user = store.user as { id: string };
    const template = await db.query.templates.findFirst({
      where: eq(templates.id, params.id),
    });
    if (!template) return { error: "Template not found" };

    const { db: database } = await import("../db");
    const { forms } = await import("../db/schema");

    const [newForm] = await database
      .insert(forms)
      .values({
        ownerId: user.id,
        title: template.title,
        description: template.description,
        schema: template.schema,
      })
      .returning();

    return { data: newForm };
  });
