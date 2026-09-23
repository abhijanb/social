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

// Used by GET /friendship/pending?userId= — userId optional (omitted =
// own pending queue, kept consistent with the list query).
export const friendshipUserQuerySchema = z.object({
  userId: z.string().cuid().optional(),
});

export type FriendshipUserQueryDto = z.infer<typeof friendshipUserQuerySchema>;

// PATCH /friendship/:id/accept takes no body — the addressee is derived
// from the JWT in the controller/service, never trusted from the client.
