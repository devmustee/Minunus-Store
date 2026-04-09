import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

function initSqliteDbFile() {
  const dbUrl = process.env.DATABASE_URL || "";
  if (!dbUrl.startsWith("file:")) return;

  // Only handle `file:/tmp/...` to keep bundling static-scoped.
  const dbPathRaw = dbUrl.slice("file:".length);
  const dbPath = dbPathRaw.startsWith("/") ? dbPathRaw : "";
  if (!dbPath.startsWith("/tmp/")) return;

  // On serverless platforms (e.g. Vercel), writing to the app directory can fail.
  // If the target is `/tmp/...` and the DB doesn't exist yet, copy the seeded
  // `dev.db` (created during build) into place.
  if (!fs.existsSync(dbPath)) {
    const seedSource = path.join(
      /*turbopackIgnore: true*/ process.cwd(),
      "dev.db",
    );
    if (fs.existsSync(seedSource)) {
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
      fs.copyFileSync(seedSource, dbPath);
    }
  }
}

initSqliteDbFile();

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
