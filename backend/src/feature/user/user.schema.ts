import { z } from "zod";

// Used by PATCH /user/me. Port of back/src/user/dto/update-user.dto.ts —
// every field optional. Same limits as register/login (username 3-20,
// password min 6), kept in sync by convention.
export const updateUserSchema = z.object({
  username: z.string().min(3).max(20).optional(),
  password: z.string().min(6).optional(),
  isPublic: z.boolean().optional(),
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>;

// Used by GET /user?search=. Optional free-text query, trimmed by the
// controller; capped so absurdly long input fails fast with a 400.
export const userSearchSchema = z.object({
  search: z.string().trim().max(50).optional().default(""),
});

export type UserSearchDto = z.infer<typeof userSearchSchema>;

// Used by GET /user/:id and DELETE /user/:id. IDs are cuids (see the
// Prisma schema); rejecting anything else here turns a Prisma throw
// into a clean 400.
export const userIdParamSchema = z.object({
  id: z.string().cuid(),
});

export type UserIdParamDto = z.infer<typeof userIdParamSchema>;
