import { AppError } from "../../lib/errorHandler.js";
import { logger } from "../../lib/logger.js";
import { ensureCanView } from "../../lib/friends.js";
import { prisma } from "../../lib/prisma.js";
import { validateOrThrow } from "../../lib/validate.js";
import { sendMessageSchema } from "./chat.schema.js";

const log = logger.child({ service: "chat" });

// Friends-only guard shared by send + history. Self-messages → 400,
// strangers → 403, deleted receiver → 404. Port of ChatService.ensureFriends.
async function ensureFriends(
  senderId: string,
  receiverId: string,
): Promise<void> {
  if (senderId === receiverId) {
    throw new AppError("Cannot message yourself", 400);
  }
  await ensureCanView(senderId, receiverId);
  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
  });
  if (!receiver) throw new AppError("Receiver not found", 404);
}

// Port of ChatService.send — validates, trims, length-checks, then saves.
export async function sendMessage(
  senderId: string,
  input: unknown,
  idempotencyKey?: string,
) {
  const dto = validateOrThrow(sendMessageSchema, input);
  const trimmed = dto.text.trim();
  if (!trimmed) throw new AppError("Message cannot be empty", 400);
  if (trimmed.length > 1000) throw new AppError("Message too long", 400);
  await ensureFriends(senderId, dto.receiverId);
  if (idempotencyKey) {
    const existing = await prisma.message.findFirst({
      where: { senderId, receiverId: dto.receiverId, idempotencyKey },
    });
    if (existing) {
      log.info({ messageId: existing.id, senderId, receiverId: dto.receiverId }, "message idempotency hit");
      return existing;
    }
  }
  const message = await prisma.message.create({
    data: {
      senderId,
      receiverId: dto.receiverId,
      text: trimmed,
      idempotencyKey: idempotencyKey ?? null,
    },
  });
  log.info({ messageId: message.id, senderId, receiverId: dto.receiverId }, "message sent");
  return message;
}

// Port of ChatService.getHistory — both directions, oldest first.
export async function getHistory(
  meId: string,
  friendId: string,
  limit = 50,
) {
  await ensureFriends(meId, friendId);
  log.debug({ meId, friendId, limit }, "chat history fetch");
  return prisma.message.findMany({
    where: {
      OR: [
        { senderId: meId, receiverId: friendId },
        { senderId: friendId, receiverId: meId },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
}
