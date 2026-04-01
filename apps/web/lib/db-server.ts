import { config } from "dotenv";
import * as path from "path";
import * as fs from "fs";
import { PrismaClient } from "@prisma/client";

// Load .env from root directory
const envPath = path.resolve(process.cwd(), "../../.env");
if (fs.existsSync(envPath)) {
  config({ path: envPath });
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create Prisma client instance
export const prisma = new PrismaClient();