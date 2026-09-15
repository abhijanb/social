import { z } from 'zod'

export const createPostSchema = z.object({
  text: z.string().trim().min(1).max(2200),
})

export type CreatePostDto = z.infer<typeof createPostSchema>
