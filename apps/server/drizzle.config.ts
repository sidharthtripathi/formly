import { defineConfig } from "drizzle-kit";
import * as path from "path";

export default defineConfig({
  schema: path.resolve(__dirname, "../../packages/shared/db/schema.ts"),
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
