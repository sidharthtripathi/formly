import { config } from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";

// Load .env from apps/server directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env");
config({ path: envPath });

import express from "express";
import cors from "cors";
import { rateLimitMiddleware } from "./middleware/rate-limit.js";
import { authMiddleware } from "./middleware/auth.js";
import { formsRouter } from "./routes/forms.js";
import { aiRouter } from "./routes/ai.js";
import { responsesRouter } from "./routes/responses.js";
import { templatesRouter } from "./routes/templates.js";
import { marketplaceRouter } from "./routes/marketplace.js";
import { usersRouter } from "./routes/users.js";
import { stripeRouter } from "./routes/stripe.js";
import { uploadsRouter } from "./routes/uploads.js";
import { webhooksRouter } from "./routes/webhooks.js";
import { staticUploads } from "./routes/static.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for correct IP detection behind reverse proxy
app.set("trust proxy", 1);

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
}));

// Raw body for Stripe webhooks (must be before express.json)
app.use("/webhooks/stripe", express.raw({ type: "application/json" }));

// JSON body parsing
app.use(express.json());

// URL-encoded form parsing
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(rateLimitMiddleware);

// Static file serving for uploads (no auth required)
app.use(staticUploads);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Public API routes (no auth required)
app.use("/api/forms/public", formsRouter);
app.use("/api/forms/:id/responses", responsesRouter); // POST only (public submission)
app.use("/api/ai", aiRouter);
app.use("/webhooks/stripe", stripeRouter);

// Protected API routes (auth required)
app.use("/api/forms", authMiddleware, formsRouter);
app.use("/api/templates", authMiddleware, templatesRouter);
app.use("/api/marketplace", authMiddleware, marketplaceRouter);
app.use("/api/users", authMiddleware, usersRouter);
app.use("/api/uploads", authMiddleware, uploadsRouter);
app.use("/api/webhooks", authMiddleware, webhooksRouter);
app.use("/api/stripe", authMiddleware, stripeRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Formly API running on http://localhost:${PORT}`);
});

export default app;
