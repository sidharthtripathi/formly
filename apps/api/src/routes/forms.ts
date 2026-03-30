import { Elysia } from "elysia";
import { db } from "../db";
import { forms } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

export const forms = new Elysia()
  .post("/api/forms", async ({ body, store }) => {
    const user = store.user as { id: string };
    const [form] = await db
      .insert(forms)
      .values({
        ownerId: user.id,
        title: body.title,
        description: body.description,
        schema: body.schema,
      })
      .returning();
    return { data: form };
  })
  .get("/api/forms", async ({ store }) => {
    const user = store.user as { id: string };
    const userForms = await db.query.forms.findMany({
      where: eq(forms.ownerId, user.id),
      orderBy: [desc(forms.updatedAt)],
    });
    return { data: userForms };
  })
  .get("/api/forms/:id", async ({ params, store, error }) => {
    const user = store.user as { id: string };
    const form = await db.query.forms.findFirst({
      where: eq(forms.id, params.id),
    });
    if (!form) return { data: null };
    if (form.ownerId !== user.id) return error(403, "Forbidden");
    return { data: form };
  })
  .patch("/api/forms/:id", async ({ params, body, store, error }) => {
    const user = store.user as { id: string };
    const existing = await db.query.forms.findFirst({
      where: eq(forms.id, params.id),
    });
    if (!existing) return error(404, "Form not found");
    if (existing.ownerId !== user.id) return error(403, "Forbidden");

    // Only allow updating specific fields (prevent mass assignment)
    const [updated] = await db
      .update(forms)
      .set({
        title: body.title,
        description: body.description,
        schema: body.schema,
        updatedAt: new Date(),
      })
      .where(eq(forms.id, params.id))
      .returning();
    return { data: updated };
  })
  .delete("/api/forms/:id", async ({ params, store, error }) => {
    const user = store.user as { id: string };
    const existing = await db.query.forms.findFirst({
      where: eq(forms.id, params.id),
    });
    if (!existing) return error(404, "Form not found");
    if (existing.ownerId !== user.id) return error(403, "Forbidden");
    await db.delete(forms).where(eq(forms.id, params.id));
    return { success: true };
  })
  .post("/api/forms/:id/publish", async ({ params, store, error }) => {
    const user = store.user as { id: string };
    const existing = await db.query.forms.findFirst({
      where: eq(forms.id, params.id),
    });
    if (!existing) return error(404, "Form not found");
    if (existing.ownerId !== user.id) return error(403, "Forbidden");

    const slug = `${params.id.slice(0, 8)}-${Math.random().toString(36).slice(2, 6)}`;
    const [published] = await db
      .update(forms)
      .set({
        isPublished: true,
        status: "published",
        publicSlug: slug,
        updatedAt: new Date(),
      })
      .where(eq(forms.id, params.id))
      .returning();
    return { data: published };
  })
  .get("/api/forms/public/:slug", async ({ params }) => {
    const form = await db.query.forms.findFirst({
      where: eq(forms.publicSlug, params.slug),
    });
    return { data: form };
  });
