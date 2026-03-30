import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import * as path from "path";
import * as fs from "fs";

// Load .env from root (two levels up from apps/server)
const envPath = path.resolve(__dirname, "../../.env");
if (fs.existsSync(envPath)) {
  config({ path: envPath });
}

export default defineConfig({
  schema: path.resolve(__dirname, "../../packages/shared/db/schema.ts"),
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
