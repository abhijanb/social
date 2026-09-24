import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { env } from "../config/env.js";

// DATABASE_URL comes from validated env — env.ts fails fast at boot
// if it is missing.
const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
});

export const prismaClientOptions = { adapter };

export function createPrismaClient() {
  return new PrismaClient(prismaClientOptions);
}

// Shared singleton — one pool per process. Under `bun --watch` modules are
// re-evaluated on every reload, so creating a client per importing module
// would leak a connection pool per reload. The globalThis guard reuses the
// existing client in dev (guide's singleton pattern); production boots once
// so it takes the direct path.
type PrismaClientType = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClientType;
};

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
