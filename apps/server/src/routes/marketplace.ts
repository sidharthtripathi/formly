import { Router } from "express";
import { prisma } from "../db/index.js";
import { AuthRequest } from "../middleware/auth.js";
import jwt from "jsonwebtoken";
import { validateUser } from "../middleware/auth.js";

export const marketplaceRouter: Router = Router();

// Helper to get optional user from request (for public routes)
async function getOptionalUser(req: AuthRequest): Promise<AuthRequest["user"] | undefined> {
  // Try X-User-Id header first (set by proxy)
  const userId = req.headers["x-user-id"] as string | undefined;
  if (userId && await validateUser(userId, req)) {
    return req.user;
  }
  // Try Bearer token
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const authSecret = process.env.AUTH_SECRET;
    if (authSecret) {
      try {
        const decoded = jwt.verify(token, authSecret) as { id: string; email: string };
        if (decoded.id && await validateUser(decoded.id, req)) {
          return req.user;
        }
      } catch {}
    }
  }
  return undefined;
}

// Helper to require auth for protected routes
async function requireAuth(req: AuthRequest): Promise<AuthRequest["user"] | null> {
  const user = await getOptionalUser(req);
  return user || null;
}

// GET /api/marketplace - List marketplace listings (public)
marketplaceRouter.get("/", async (req, res) => {
  try {
    const { category, sort = "upvotes", q } = req.query as { category?: string; sort?: string; q?: string };

    let listings = await prisma.marketplaceListing.findMany({
      take: 50,
    });

    // Filter by category if provided
    if (category) {
      listings = listings.filter((l: typeof listings[number]) => l.category === category);
    }

    // Filter by search query if provided
    if (q) {
      const query = q.toLowerCase();
      listings = listings.filter(
        (l: typeof listings[number]) =>
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
    const user = await requireAuth(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // First create the template
    const template = await prisma.template.create({
      data: {
        ownerId: user.id,
        title: req.body.title,
        description: req.body.description,
        schema: req.body.schema,
        isPublic: true,
      },
    });

    // Then create the marketplace listing
    const listing = await prisma.marketplaceListing.create({
      data: {
        templateId: template.id,
        publisherId: user.id,
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        tags: req.body.tags,
      },
    });

    return res.status(201).json({ data: listing });
  } catch (error) {
    console.error("Create marketplace listing error:", error);
    return res.status(500).json({ error: "Failed to create listing" });
  }
});

// DELETE /api/marketplace/:id - Delete listing
marketplaceRouter.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: req.params.id },
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    if (listing.publisherId !== user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await prisma.marketplaceListing.delete({
      where: { id: req.params.id },
    });
    return res.json({ success: true });
  } catch (error) {
    console.error("Delete marketplace listing error:", error);
    return res.status(500).json({ error: "Failed to delete listing" });
  }
});

// POST /api/marketplace/:id/upvote - Toggle upvote
marketplaceRouter.post("/:id/upvote", async (req: AuthRequest, res) => {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: req.params.id },
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    // Check if already upvoted
    const existing = await prisma.marketplaceUpvote.findUnique({
      where: {
        userId_listingId: {
          userId: user.id,
          listingId: req.params.id,
        },
      },
    });

    if (existing) {
      // Remove upvote and decrement count
      await prisma.marketplaceUpvote.delete({
        where: {
          userId_listingId: {
            userId: user.id,
            listingId: req.params.id,
          },
        },
      });

      await prisma.marketplaceListing.update({
        where: { id: req.params.id },
        data: { upvoteCount: Math.max(0, listing.upvoteCount - 1) },
      });

      return res.json({ upvoted: false });
    }

    // Add upvote and increment count
    await prisma.marketplaceUpvote.create({
      data: {
        userId: user.id,
        listingId: req.params.id,
      },
    });

    await prisma.marketplaceListing.update({
      where: { id: req.params.id },
      data: { upvoteCount: listing.upvoteCount + 1 },
    });

    return res.json({ upvoted: true });
  } catch (error) {
    console.error("Toggle upvote error:", error);
    return res.status(500).json({ error: "Failed to toggle upvote" });
  }
});

// POST /api/marketplace/:id/copy - Copy template
marketplaceRouter.post("/:id/copy", async (req: AuthRequest, res) => {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: req.params.id },
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    const template = await prisma.template.findUnique({
      where: { id: listing.templateId },
    });

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    // Create a copy of the template as a form
    const newForm = await prisma.template.create({
      data: {
        ownerId: user.id,
        title: `${template.title} (Copy)`,
        description: template.description,
        schema: template.schema,
        isPublic: false,
        sourceFormId: template.id,
      },
    });

    // Increment copy count on listing
    await prisma.marketplaceListing.update({
      where: { id: req.params.id },
      data: { copyCount: listing.copyCount + 1 },
    });

    return res.status(201).json({ data: newForm });
  } catch (error) {
    console.error("Copy template error:", error);
    return res.status(500).json({ error: "Failed to copy template" });
  }
});