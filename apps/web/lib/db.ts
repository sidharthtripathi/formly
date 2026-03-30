import { config } from "dotenv";
import * as path from "path";
import * as fs from "fs";

// Load .env from root directory (same as server does)
const envPath = path.resolve(process.cwd(), "../../.env");
if (fs.existsSync(envPath)) {
  config({ path: envPath });
}

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@formly/shared/db/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const client = postgres(connectionString);
export const db = drizzle(client, { schema });

export { schema };
