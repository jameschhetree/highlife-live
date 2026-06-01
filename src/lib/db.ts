// HighLife Live -- Database Client (Prisma 7 + pg adapter)
// Connects to Prisma Postgres via @prisma/adapter-pg.
// Falls back to null when DATABASE_URL is not set.

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient | null {
  const url =
    process.env.DATABASE_URL ||
    process.env.PRISMA_DATABASE_URL ||
    process.env.POSTGRES_URL;
  if (!url) {
    return null;
  }
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

// Singleton: reuse across hot reloads in dev
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production" && prisma) {
  globalForPrisma.prisma = prisma;
}

// Helper to check if DB is available
export function isDatabaseConnected(): boolean {
  return !!(process.env.DATABASE_URL || process.env.PRISMA_DATABASE_URL) && !!prisma;
}
