import { z } from "zod";

// Used by register (POST /user) and login (POST /user/login).
// Port of back/src/user/dto/create-user.dto.ts — same limits so the
// frontend gets identical validation errors from the Express backend.
export const authSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(6),
});

export type AuthDto = z.infer<typeof authSchema>;
