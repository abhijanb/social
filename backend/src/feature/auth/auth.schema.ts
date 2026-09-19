import { z } from "zod";

// Used by register (POST /user) — extends base authSchema with email.
// Login only needs username + password.
export const authSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(6),
});

export const registerSchema = authSchema.extend({
  email: z.string().email("Invalid email address"),
});

export type AuthDto = z.infer<typeof authSchema>;
export type RegisterDto = z.infer<typeof registerSchema>;
