import { prisma } from "../src/lib/prisma";
import * as bcrypt from "bcrypt";

async function main() {
  const hashed = await bcrypt.hash("password123", 10);

  const alice = await prisma.user.upsert({
    where: { username: "alice" },
    update: {},
    create: {
      username: "alice",
      email: "alice@example.com",
      password: hashed,
    },
  });

  const bob = await prisma.user.upsert({
    where: { username: "bob" },
    update: {},
    create: {
      username: "bob",
      email: "bob@example.com",
      password: hashed,
    },
  });

  const charlie = await prisma.user.upsert({
    where: { username: "charlie" },
    update: {},
    create: {
      username: "charlie",
      email: "charlie@example.com",
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

  // Default mail templates ({{placeholders}} rendered by sendMail callers).
  const templates = [
    {
      key: "welcome",
      subject: "Welcome to Social, {{username}}!",
      bodyText: "Hi {{username}},\n\nWelcome to Social! Find your friends and start sharing.\n\n— The Social team",
      bodyHtml: "<p>Hi {{username}},</p><p>Welcome to Social! Find your friends and start sharing.</p><p>— The Social team</p>",
    },
    {
      key: "friend-request",
      subject: "{{actor}} sent you a friend request",
      bodyText: "Hi {{username}},\n\n{{actor}} sent you a friend request. Open Social to accept or decline.",
      bodyHtml: "<p>Hi {{username}},</p><p>{{actor}} sent you a friend request. Open Social to accept or decline.</p>",
    },
    {
      key: "friend-accepted",
      subject: "{{actor}} accepted your friend request",
      bodyText: "Hi {{username}},\n\n{{actor}} accepted your friend request. Say hello!",
      bodyHtml: "<p>Hi {{username}},</p><p>{{actor}} accepted your friend request. Say hello!</p>",
    },
    {
      key: "post-like",
      subject: "{{actor}} liked your post",
      bodyText: "Hi {{username}},\n\n{{actor}} liked your post. Open Social to see it.",
      bodyHtml: "<p>Hi {{username}},</p><p>{{actor}} liked your post. Open Social to see it.</p>",
    },
    {
      key: "post-comment",
      subject: "{{actor}} commented on your post",
      bodyText: "Hi {{username}},\n\n{{actor}} commented on your post. Open Social to reply.",
      bodyHtml: "<p>Hi {{username}},</p><p>{{actor}} commented on your post. Open Social to reply.</p>",
    },
    {
      key: "story-view",
      subject: "{{actor}} viewed your story",
      bodyText: "Hi {{username}},\n\n{{actor}} viewed your story.",
      bodyHtml: "<p>Hi {{username}},</p><p>{{actor}} viewed your story.</p>",
    },
  ];
  for (const t of templates) {
    await prisma.mailTemplate.upsert({
      where: { key: t.key },
      update: {},
      create: t,
    });
  }

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
