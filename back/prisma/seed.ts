import { createPrismaClient } from "../src/lib/prisma";
import * as bcrypt from "bcrypt";

const prisma = createPrismaClient();

async function main() {
  const hashed = await bcrypt.hash("password123", 10);

  const alice = await prisma.user.upsert({
    where: { username: "alice" },
    update: {},
    create: {
      username: "alice",
      password: hashed,
    },
  });

  const bob = await prisma.user.upsert({
    where: { username: "bob" },
    update: {},
    create: {
      username: "bob",
      password: hashed,
    },
  });

  const charlie = await prisma.user.upsert({
    where: { username: "charlie" },
    update: {},
    create: {
      username: "charlie",
      password: hashed,
    },
  });

  // Example friendships: alice <-> bob accepted, alice -> charlie pending
  await prisma.friendship.upsert({
    where: {
      requesterId_addresseeId: { requesterId: alice.id, addresseeId: bob.id },
    },
    update: { status: "ACCEPTED" },
    create: {
      requesterId: alice.id,
      addresseeId: bob.id,
      status: "ACCEPTED",
    },
  });

  await prisma.friendship.upsert({
    where: {
      requesterId_addresseeId: { requesterId: alice.id, addresseeId: charlie.id },
    },
    update: {},
    create: {
      requesterId: alice.id,
      addresseeId: charlie.id,
      status: "PENDING",
    },
  });

  console.log(`Seeded users: alice(${alice.id}), bob(${bob.id}), charlie(${charlie.id}) with friendships`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
