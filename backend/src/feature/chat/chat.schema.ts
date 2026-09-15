import { z } from "zod";

// Used by POST /chat/send. Port of back/src/chat/dto/send-message.dto.ts.
export const sendMessageSchema = z.object({
  receiverId: z.string().min(1),
  text: z.string().trim().min(1).max(1000),
});

export type SendMessageDto = z.infer<typeof sendMessageSchema>;

// Used by GET /chat/history?friendId=&limit=. friendId required (the
// Nest controller 401s without it); limit clamps to 1-100, default 50.
export const chatHistoryQuerySchema = z.object({
  friendId: z.string().trim().min(1, "friendId required"),
  limit: z.string().optional().default("50"),
});

export type ChatHistoryQueryDto = z.infer<typeof chatHistoryQuerySchema>;
