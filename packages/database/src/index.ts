import { PrismaClient } from '@prisma/client';

// Export one PrismaClient for the whole API process. Prisma manages a database
// connection pool under the hood, so creating a client per request is wasteful
// and can exhaust SQLite/file handles during batch generation.
export const prisma = new PrismaClient();
export * from '@prisma/client';
