import { z } from "zod";

// Used by PATCH|DELETE /notification/:id and PATCH /:id/read.
// Rejecting non-cuids here turns a Prisma throw into a clean 400.
export const notificationIdParamSchema = z.object({
  id: z.string().cuid(),
});

export type NotificationIdParamDto = z.infer<typeof notificationIdParamSchema>;
