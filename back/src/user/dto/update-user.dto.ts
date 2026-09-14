import { z } from 'zod'
import { createUserSchema } from './create-user.dto'

export const updateUserSchema = createUserSchema.partial().extend({
  isPublic: z.boolean().optional(),
})

export type UpdateUserDto = import('zod').infer<typeof updateUserSchema>
