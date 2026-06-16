import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

function createPrismaClient() {
  return new PrismaClient({ adapter });
}

function isStalePrismaClient(client: PrismaClient) {
  return typeof client.store?.findMany !== "function";
}

function getPrismaClient() {
  const cached = globalForPrisma.prisma;

  if (cached && !isStalePrismaClient(cached)) {
    return cached;
  }

  const client = createPrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
}

const prisma = getPrismaClient();

export default prisma;
