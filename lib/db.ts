import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

function setupDatabaseUrl() {
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    const tmpDbPath = path.join("/tmp", "dev.db");
    const sourceDbPath = path.join(process.cwd(), "prisma", "dev.db");

    try {
      if (!fs.existsSync(tmpDbPath) && fs.existsSync(sourceDbPath)) {
        fs.copyFileSync(sourceDbPath, tmpDbPath);
      }
      if (fs.existsSync(tmpDbPath)) {
        process.env.DATABASE_URL = `file:${tmpDbPath}`;
      }
    } catch (err) {
      console.warn("Could not sync SQLite DB to /tmp:", err);
    }
  }
}

setupDatabaseUrl();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

