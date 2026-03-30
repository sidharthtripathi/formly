import { config } from "dotenv";
import * as path from "path";
import * as fs from "fs";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@formly/shared/db/schema.js";

// Load .env from root directory
const envPath = path.resolve(process.cwd(), "../../.env");
if (fs.existsSync(envPath)) {
  config({ path: envPath });
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const client = postgres(connectionString);
export const db = drizzle(client, { schema });

export const {
  users,
  forms,
  responses,
  templates,
  marketplaceListings,
  marketplaceUpvotes,
  analysisConversations,
  subscriptions,
  webhooks,
  formThemes,
  collaborators,
  emailNotifications,
  accounts,
  sessions,
  verificationTokens,
} = schema;

export { schema };
