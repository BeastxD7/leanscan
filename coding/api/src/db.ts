/**
 * Prisma client singleton.
 * Use this everywhere instead of opening multiple connections.
 *
 * Example:
 *   import { prisma } from './db.js';
 *   const user = await prisma.user.findUnique({ where: { email } });
 */
import { PrismaClient, Prisma } from '@prisma/client';
import { config, isDev } from './config.js';

// In dev we attach Prisma to globalThis so hot reload doesn't open a new client every save.
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createClient(): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: { url: config.DATABASE_URL },
    },
    log: isDev ? ['warn', 'error'] : ['error'],
  });
}

export const prisma: PrismaClient = globalThis.__prisma ?? createClient();

if (isDev) {
  globalThis.__prisma = prisma;
}

// Note: slow-query / structured Prisma event logging will be added in a follow-up
// using $extends (the modern Prisma 5+ pattern). Skipped here to keep V1 typing clean.

export async function shutdown(): Promise<void> {
  await prisma.$disconnect();
}

// Re-export Prisma namespace for typed transaction helpers etc.
export { Prisma };
