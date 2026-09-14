import { z } from 'zod'

export const sendMessageSchema = z.object({
  receiverId: z.string().min(1),
  text: z.string().trim().min(1).max(1000),
})

export type SendMessageDto = z.infer<typeof sendMessageSchema>
