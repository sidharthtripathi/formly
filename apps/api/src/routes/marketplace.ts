import { Elysia } from "elysia";
import { db } from "../db";
import { marketplaceListings, marketplaceUpvotes, templates } from "../db/schema";
import { eq, desc } from "drizzle-orm";

export const marketplace = new Elysia()
  .get("/api/marketplace", async ({ query }) => {
    const { category, sort = "upvotes", q } = query || {};

    let qb = db.query.marketplaceListings.findMany({
      orderBy: [desc(marketplaceListings.upvoteCount)],
      limit: 50,
    });

    const listings = await qb;
    return { data: listings };
  })
  .post("/api/marketplace", async ({ body, store }) => {
    const user = store.user as { id: string };

    const [template] = await db
      .insert(templates)
      .values({
        ownerId: user.id,
        title: body.title,
        description: body.description,
        schema: body.schema,
        isPublic: true,
      })
      .returning();

    const [listing] = await db
      .insert(marketplaceListings)
      .values({
        templateId: template.id,
        publisherId: user.id,
        title: body.title,
        description: body.description,
        category: body.category,
        tags: body.tags,
      })
      .returning();

    return { data: listing };
  })
  .delete("/api/marketplace/:id", async ({ params, store, error }) => {
    const user = store.user as { id: string };
    const listing = await db.query.marketplaceListings.findFirst({
      where: eq(marketplaceListings.id, params.id),
    });
    if (!listing) return error(404, "Listing not found");
    if (listing.publisherId !== user.id) return error(403, "Forbidden");
    await db
      .delete(marketplaceListings)
      .where(eq(marketplaceListings.id, params.id));
    return { success: true };
  })
  .post("/api/marketplace/:id/upvote", async ({ params, store, error }) => {
    const user = store.user as { id: string };

    const listing = await db.query.marketplaceListings.findFirst({
      where: eq(marketplaceListings.id, params.id),
    });
    if (!listing) return error(404, "Listing not found");

    const existing = await db.query.marketplaceUpvotes.findFirst({
      where: (u, { and }) =>
        and(eq(u.userId, user.id), eq(u.listingId, params.id)),
    });

    if (existing) {
      await db
        .delete(marketplaceUpvotes)
        .where(
          (u: any) => u.userId === user.id && u.listingId === params.id
        );
      await db
        .update(marketplaceListings)
        .set({ upvoteCount: marketplaceListings.upvoteCount })
        .where(eq(marketplaceListings.id, params.id));
      return { upvoted: false };
    }

    await db.insert(marketplaceUpvotes).values({
      userId: user.id,
      listingId: params.id,
    });
    return { upvoted: true };
  })
  .post("/api/marketplace/:id/copy", async ({ params, store }) => {
    const user = store.user as { id: string };

    const listing = await db.query.marketplaceListings.findFirst({
      where: eq(marketplaceListings.id, params.id),
    });
    if (!listing) return { error: "Listing not found" };

    const template = await db.query.templates.findFirst({
      where: eq(templates.id, listing.templateId),
    });
    if (!template) return { error: "Template not found" };

    const [newForm] = await db
      .insert(templates)
      .values({
        ownerId: user.id,
        title: `${template.title} (Copy)`,
        description: template.description,
        schema: template.schema,
        isPublic: false,
        sourceFormId: template.id,
      })
      .returning();

    return { data: newForm };
  });
