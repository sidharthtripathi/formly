import { Elysia } from "elysia";
import { forms } from "./routes/forms";
import { ai } from "./routes/ai";
import { responses } from "./routes/responses";
import { templates } from "./routes/templates";
import { marketplace } from "./routes/marketplace";
import { users } from "./routes/users";
import { stripeRoutes } from "./routes/stripe";
import { uploads } from "./routes/uploads";
import { webhooksRoutes } from "./routes/webhooks";
import { staticUploads } from "./routes/static";
import { authMiddleware, type AuthContext } from "./middleware/auth";
import { rateLimit } from "./middleware/rate-limit";

declare module "elysia" {
  interface Hooks {
    store: AuthContext;
  }
}

const app = new Elysia({ prefix: "/api" })
  .use(rateLimit)
  .use(staticUploads) // serves /uploads/* without auth
  .use(authMiddleware)
  .use(forms)
  .use(ai)
  .use(responses)
  .use(templates)
  .use(marketplace)
  .use(users)
  .use(stripeRoutes)
  .use(uploads)
  .use(webhooksRoutes)
  .get("/health", () => ({ status: "ok" }));

export type App = typeof app;

app.listen(3001, () => {
  console.log("Formly API running on http://localhost:3001");
});

export { app };
