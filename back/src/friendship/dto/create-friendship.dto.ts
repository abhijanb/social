import { z } from 'zod'

export const createFriendshipSchema = z.object({
  requesterId: z.string().cuid(),
  addresseeId: z.string().cuid(),
})

export type CreateFriendshipDto = z.infer<typeof createFriendshipSchema>
