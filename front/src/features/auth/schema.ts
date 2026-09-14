import { z } from 'zod'

export const authSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters'),
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
})

export const loginSchema = authSchema
export const registerSchema = authSchema

export type AuthFormData = z.infer<typeof authSchema>
export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
