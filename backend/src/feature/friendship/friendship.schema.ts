import { z } from "zod";

// Used by POST /friendship. Port of back/src/friendship/dto/
// create-friendship.dto.ts — requesterId comes from the JWT
// (set in the controller), only addresseeId is client-supplied.
export const createFriendshipSchema = z.object({
  addresseeId: z.string().cuid(),
});

export type CreateFriendshipDto = z.infer<typeof createFriendshipSchema>;

// Used by PATCH /friendship/:id. Port of back/src/friendship/dto/
// update-friendship.dto.ts.
export const updateFriendshipSchema = z.object({
  status: z.enum(["PENDING", "ACCEPTED", "BLOCKED"]),
});

export type UpdateFriendshipDto = z.infer<typeof updateFriendshipSchema>;

// Used by GET|PATCH|DELETE /friendship/:id and PATCH /:id/accept.
// Rejecting non-cuids here turns a Prisma throw into a clean 400.
export const friendshipIdParamSchema = z.object({
  id: z.string().cuid(),
});

export type FriendshipIdParamDto = z.infer<typeof friendshipIdParamSchema>;

// Used by GET /friendship?userId= — userId optional (without it the
// route returns recent rows, kept for Nest parity).
export const friendshipListQuerySchema = z.object({
  userId: z.string().cuid().optional(),
});

export type FriendshipListQueryDto = z.infer<typeof friendshipListQuerySchema>;

// Used by GET /friendship/pending?userId=.
export const friendshipUserQuerySchema = z.object({
  userId: z.string().cuid(),
});

export type FriendshipUserQueryDto = z.infer<typeof friendshipUserQuerySchema>;

// Used by the PATCH /friendship/:id/accept body { userId } — only the
// addressee may accept, enforced in the service.
export const acceptFriendshipSchema = z.object({
  userId: z.string().cuid(),
});

export type AcceptFriendshipDto = z.infer<typeof acceptFriendshipSchema>;
