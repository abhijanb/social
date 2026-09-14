import { z } from 'zod'

export const updateFriendshipSchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'BLOCKED']),
})

export type UpdateFriendshipDto = z.infer<typeof updateFriendshipSchema>
