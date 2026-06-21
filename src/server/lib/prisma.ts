import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import type { SqlDriverAdapterFactory } from "@prisma/driver-adapter-utils";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
  pgPool: Pool;
  __testPrismaAdapter?: SqlDriverAdapterFactory;
};

const connectionString = process.env.DATABASE_URL;
const pool = globalForPrisma.pgPool ?? new Pool({ connectionString });
const adapter = globalForPrisma.__testPrismaAdapter ?? new PrismaPg(pool);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pgPool = pool;
}
