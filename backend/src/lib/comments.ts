// Shared delta-poll comment listing – single source of truth (was duplicated
// across post.service listPostComments and livestream.service getComments).
// Callers inject model-specific Prisma closures so scope field, soft-delete
// filter, and include stay with them; this owns clamp + branch + reverse.

/** Max comments returned per comments request (delta or initial page). */
export const COMMENTS_PAGE_SIZE = 100;

/** Clamps a client limit into [1, COMMENTS_PAGE_SIZE] (defaults to 50). */
export function clampCommentLimit(limit = 50): number {
  return Math.min(COMMENTS_PAGE_SIZE, Math.max(1, Math.floor(limit) || 50));
}

export type CommentCursor = {
  createdAt: Date;
  /** Scope id the cursor must belong to (postId or streamId). */
  scopeId: string;
};

export type ListCommentsPageArgs<T> = {
  sinceId?: string;
  limit?: number;
  /** Latest page, newest first (reversed to oldest-first by the helper). */
  fetchLatest: (take: number) => Promise<T[]>;
  /** Resolves a cursor id to its timestamp + scope, or null when unknown. */
  fetchCursor: (id: string) => Promise<CommentCursor | null>;
  /** Strictly newer than (createdAt, sinceId) — id breaks cuid ties. */
  fetchDelta: (take: number, createdAt: Date, sinceId: string) => Promise<T[]>;
  /** Scope the cursor must belong to (postId or streamId). */
  scopeId: string;
};

/**
 * Without sinceId returns the latest page (oldest first); with sinceId only
 * strictly newer comments. Unknown cursors (or ones from another scope)
 * fall back to the latest page so pollers self-heal instead of stalling.
 */
export async function listCommentsPage<T>(
  args: ListCommentsPageArgs<T>,
): Promise<T[]> {
  const n = clampCommentLimit(args.limit);
  if (!args.sinceId) {
    const latest = await args.fetchLatest(n);
    return latest.reverse();
  }
  const cursor = await args.fetchCursor(args.sinceId);
  if (!cursor || cursor.scopeId !== args.scopeId) {
    const latest = await args.fetchLatest(n);
    return latest.reverse();
  }
  return args.fetchDelta(n, cursor.createdAt, args.sinceId);
}
