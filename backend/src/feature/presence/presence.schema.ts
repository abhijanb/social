import { z } from "zod";

// Used by GET /presence?ids=. Comma-separated user ids, capped so the
// query string cannot grow unbounded (controller slices to 50 after
// trimming, same as the Nest controller).
export const presenceQuerySchema = z.object({
  ids: z.string().max(2000).optional().default(""),
});

export type PresenceQueryDto = z.infer<typeof presenceQuerySchema>;
