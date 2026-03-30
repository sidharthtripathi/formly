import { Router } from "express";
import { db, marketplaceListings, marketplaceUpvotes, templates } from "../db/index.js";
import { eq, desc, and } from "drizzle-orm";
import { AuthRequest } from "../middleware/auth.js";

export const marketplaceRouter = Router();

// GET /api/marketplace - List marketplace listings
marketplaceRouter.get("/", async (req, res) => {
  try {
    const { category, sort = "upvotes", q } = req.query as { category?: string; sort?: string; q?: string };

    let listings = await db.query.marketplaceListings.findMany({
      orderBy: [desc(marketplaceListings.upvoteCount)],
      limit: 50,
    });

    // Filter by category if provided
    if (category) {
      listings = listings.filter((l) => l.category === category);
    }

    // Filter by search query if provided
    if (q) {
      const query = q.toLowerCase();
      listings = listings.filter(
        (l) =>
          l.title.toLowerCase().includes(query) ||
          l.description?.toLowerCase().includes(query)
      );
    }

    return res.json({ data: listings });
  } catch (error) {
    console.error("List marketplace error:", error);
    return res.status(500).json({ error: "Failed to list marketplace" });
  }
});

// POST /api/marketplace - Create marketplace listing
marketplaceRouter.post("/", async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // First create the template
    const [template] = await db
      .insert(templates)
      .values({
        ownerId: user.id,
        title: req.body.title,
        description: req.body.description,
        schema: req.body.schema,
        isPublic: true,
      })
      .returning();

    // Then create the marketplace listing
    const [listing] = await db
      .insert(marketplaceListings)
      .values({
        templateId: template.id,
        publisherId: user.id,
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        tags: req.body.tags,
      })
      .returning();

    return res.status(201).json({ data: listing });
  } catch (error) {
    console.error("Create marketplace listing error:", error);
    return res.status(500).json({ error: "Failed to create listing" });
  }
});

// DELETE /api/marketplace/:id - Delete listing
marketplaceRouter.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const listing = await db.query.marketplaceListings.findFirst({
      where: eq(marketplaceListings.id, req.params.id),
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    if (listing.publisherId !== user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await db.delete(marketplaceListings).where(eq(marketplaceListings.id, req.params.id));
    return res.json({ success: true });
  } catch (error) {
    console.error("Delete marketplace listing error:", error);
    return res.status(500).json({ error: "Failed to delete listing" });
  }
});

// POST /api/marketplace/:id/upvote - Toggle upvote
marketplaceRouter.post("/:id/upvote", async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const listing = await db.query.marketplaceListings.findFirst({
      where: eq(marketplaceListings.id, req.params.id),
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    // Check if already upvoted
    const existing = await db.query.marketplaceUpvotes.findFirst({
      where: and(
        eq(marketplaceUpvotes.userId, user.id),
        eq(marketplaceUpvotes.listingId, req.params.id)
      ),
    });

    if (existing) {
      // Remove upvote and decrement count
      await db
        .delete(marketplaceUpvotes)
        .where(
          and(
            eq(marketplaceUpvotes.userId, user.id),
            eq(marketplaceUpvotes.listingId, req.params.id)
          )
        );

      await db
        .update(marketplaceListings)
        .set({ upvoteCount: Math.max(0, listing.upvoteCount - 1) })
        .where(eq(marketplaceListings.id, req.params.id));

      return res.json({ upvoted: false });
    }

    // Add upvote and increment count
    await db.insert(marketplaceUpvotes).values({
      userId: user.id,
      listingId: req.params.id,
    });

    await db
      .update(marketplaceListings)
      .set({ upvoteCount: listing.upvoteCount + 1 })
      .where(eq(marketplaceListings.id, req.params.id));

    return res.json({ upvoted: true });
  } catch (error) {
    console.error("Toggle upvote error:", error);
    return res.status(500).json({ error: "Failed to toggle upvote" });
  }
});

// POST /api/marketplace/:id/copy - Copy template
marketplaceRouter.post("/:id/copy", async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const listing = await db.query.marketplaceListings.findFirst({
      where: eq(marketplaceListings.id, req.params.id),
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    const template = await db.query.templates.findFirst({
      where: eq(templates.id, listing.templateId),
    });

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    // Create a copy of the template as a form
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

    // Increment copy count on listing
    await db
      .update(marketplaceListings)
      .set({ copyCount: listing.copyCount + 1 })
      .where(eq(marketplaceListings.id, req.params.id));

    return res.status(201).json({ data: newForm });
  } catch (error) {
    console.error("Copy template error:", error);
    return res.status(500).json({ error: "Failed to copy template" });
  }
});
