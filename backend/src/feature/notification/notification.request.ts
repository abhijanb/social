import { AppError } from "../../lib/errorHandler.js";
import { prisma } from "../../lib/prisma.js";

// Username for notification content ("alice liked your post").
async function resolveUsername(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });
  if (!user) throw new AppError("User not found", 404);
  return user.username;
}

// One notify function per type — each owns its content text and related
// fields. Call sites pass ids only; guards (self-skip, first-view-only,
// like-only) stay at the call sites that own that state.
export async function notifyFriendRequest(
  addresseeId: string,
  requesterId: string,
) {
  const requester = await resolveUsername(requesterId);
  return prisma.notification.create({
    data: {
      userId: addresseeId,
      type: "FRIEND_REQUEST",
      content: `${requester} sent you a friend request`,
      relatedUser: requesterId,
    },
  });
}

export async function notifyFriendAccepted(
  requesterId: string,
  addresseeId: string,
) {
  const addressee = await resolveUsername(addresseeId);
  return prisma.notification.create({
    data: {
      userId: requesterId,
      type: "FRIEND_ACCEPTED",
      content: `${addressee} accepted your friend request`,
      relatedUser: addresseeId,
    },
  });
}

export async function notifyPostLike(
  authorId: string,
  likerId: string,
  postId: string,
) {
  const liker = await resolveUsername(likerId);
  return prisma.notification.create({
    data: {
      userId: authorId,
      type: "POST_LIKE",
      content: `${liker} liked your post`,
      relatedPost: postId,
      relatedUser: likerId,
    },
  });
}

export async function notifyPostComment(
  authorId: string,
  commenterId: string,
  postId: string,
) {
  const commenter = await resolveUsername(commenterId);
  return prisma.notification.create({
    data: {
      userId: authorId,
      type: "POST_COMMENT",
      content: `${commenter} commented on your post`,
      relatedPost: postId,
      relatedUser: commenterId,
    },
  });
}

export async function notifyStoryView(authorId: string, viewerId: string) {
  const viewer = await resolveUsername(viewerId);
  return prisma.notification.create({
    data: {
      userId: authorId,
      type: "STORY_VIEW",
      content: `${viewer} viewed your story`,
      relatedUser: viewerId,
    },
  });
}

async function assertOwnNotification(id: string, userId: string) {
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.isDeleted) {
    throw new AppError("Notification not found", 404);
  }
  if (notification.userId !== userId) {
    throw new AppError("Not your notification", 403);
  }
  return notification;
}

// Mark own notification as read. Missing/deleted → 404, another user's → 403.
export async function markNotificationAsRead(id: string, userId: string) {
  await assertOwnNotification(id, userId);
  return prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
}

// Soft-delete own notification. Missing/deleted → 404, another user's → 403.
export async function deleteNotification(id: string, userId: string) {
  await assertOwnNotification(id, userId);
  return prisma.notification.update({
    where: { id },
    data: { isDeleted: true },
  });
}
