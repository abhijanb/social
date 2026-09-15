import { AppError } from "../../lib/errorHandler.js";
import { prisma } from "../../lib/prisma.js";
import { validateOrThrow } from "../../lib/validate.js";
import { sendMessageSchema } from "./chat.schema.js";

// Friends-only guard shared by send + history. Self-messages → 400,
// strangers → 403, deleted receiver → 404. Port of ChatService.ensureFriends.
async function ensureFriends(
  senderId: string,
  receiverId: string,
): Promise<void> {
  if (senderId === receiverId) {
    throw new AppError("Cannot message yourself", 400);
  }
  const friendship = await prisma.friendship.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterId: senderId, addresseeId: receiverId },
        { requesterId: receiverId, addresseeId: senderId },
      ],
    },
  });
  if (!friendship) throw new AppError("Not friends", 403);
  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
  });
  if (!receiver) throw new AppError("Receiver not found", 404);
}

// Port of ChatService.send — validates, trims, length-checks, then saves.
export async function sendMessage(
  senderId: string,
  input: unknown,
) {
  const dto = validateOrThrow(sendMessageSchema, input);
  const trimmed = dto.text.trim();
  if (!trimmed) throw new AppError("Message cannot be empty", 400);
  if (trimmed.length > 1000) throw new AppError("Message too long", 400);
  await ensureFriends(senderId, dto.receiverId);
  return prisma.message.create({
    data: { senderId, receiverId: dto.receiverId, text: trimmed },
  });
}

// Port of ChatService.getHistory — both directions, oldest first.
export async function getHistory(
  meId: string,
  friendId: string,
  limit = 50,
) {
  await ensureFriends(meId, friendId);
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
