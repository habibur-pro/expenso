import "server-only";

import { PrismaClient } from "@/generated/prisma";

const createPrismaClient = () => {
  const url = process.env.DB_URI;

  if (!url) {
    throw new Error("DB_URI is not set. Add it to your .env file.");
  }

  return new PrismaClient({ datasourceUrl: url });
};

// Next.js hot reloading re-evaluates modules on every change, so without this
// cache each reload would open a new connection pool.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
