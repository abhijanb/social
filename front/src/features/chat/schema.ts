import { z } from 'zod'

// Max message length — mirrors backend chat.schema max(1000) + the
// "Message too long" service check. Single home for the cap: the schema
// below and the input UI both read it, so keep in sync with the server.
export const MAX_MESSAGE_LENGTH = 1000

// Client mirror of backend sendMessageSchema
// (backend/src/feature/chat/chat.schema.ts). Validated in useChat.send
// before touching socket or REST, so payloads the server would 400 never
// cost a network call.
export const sendMessageSchema = z.object({
  receiverId: z.string().min(1),
  text: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
})

export type SendMessageData = z.infer<typeof sendMessageSchema>
