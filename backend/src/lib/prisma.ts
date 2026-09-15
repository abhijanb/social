import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

// Port of back/src/lib/prisma.ts — same DATABASE_URL contract and
// adapter setup so the Express backend talks to the shared database
const rawDatabaseUrl = process.env.DATABASE_URL;
const databaseUrl = (rawDatabaseUrl ?? "").trim();
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
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

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
