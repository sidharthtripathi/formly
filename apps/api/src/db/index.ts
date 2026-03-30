import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import * as schemaExtensions from "./schema-extensions";

const sql = postgres(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema: { ...schema, ...schemaExtensions } });

// Re-export tables for use in routes
export * from "./schema";
export * from "./schema-extensions";
