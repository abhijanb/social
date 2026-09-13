import { createUserSchema } from './create-user.dto'

export const updateUserSchema = createUserSchema.partial()

export type UpdateUserDto = import('zod').infer<typeof updateUserSchema>
