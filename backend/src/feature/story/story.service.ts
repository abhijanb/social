import { AppError } from "../../lib/errorHandler.js";
import { ensureCanView, getFriendIds } from "../../lib/friends.js";
import { prisma } from "../../lib/prisma.js";
import { validateOrThrow } from "../../lib/validate.js";
import { createStorySchema } from "./story.schema.js";

const authorSelect = { id: true, username: true, avatarUrl: true } as const;
const storyInclude = {
  author: { select: authorSelect },
  _count: { select: { views: true } },
} as const;

export type StoryMediaKindDto = "IMAGE" | "VIDEO";

export type StoryWithAuthor = {
  id: string;
  authorId: string;
  url: string;
  kind: StoryMediaKindDto;
  text: string;
  expiresAt: Date;
  createdAt: Date;
  author: { id: string; username: string; avatarUrl: string | null };
  viewsCount: number;
  viewedByMe: boolean;
};

export type StoryFeedGroup = {
  author: { id: string; username: string; avatarUrl: string | null };
  stories: StoryWithAuthor[];
  hasUnseen: boolean;
};

/** Stories live 24h (Instagram default). */
export const STORY_TTL_MS = 24 * 60 * 60 * 1000;
/** Cap of active stories per user to avoid spam. */
export const MAX_ACTIVE_STORIES = 20;

type StoryRow = {
  id: string;
  authorId: string;
  url: string;
  kind: StoryMediaKindDto;
  text: string;
  expiresAt: Date;
  createdAt: Date;
  author: { id: string; username: string; avatarUrl: string | null };
  _count: { views: number };
};

async function withViewedState(
  rows: StoryRow[],
  meId: string,
): Promise<StoryWithAuthor[]> {
  if (rows.length === 0) return [];
  const views = await prisma.storyView.findMany({
    where: { storyId: { in: rows.map((r) => r.id) }, viewerId: meId },
    select: { storyId: true },
  });
  const viewedIds = new Set(views.map((v) => v.storyId));
  return rows.map(({ _count, ...rest }) => ({
    ...rest,
    viewsCount: _count.views,
    viewedByMe: viewedIds.has(rest.id),
  }));
}

// Create a story — single media required, optional short caption.
// Expires 24h after creation.
export async function createStory(
  authorId: string,
  text: string,
  media: { url: string; kind: StoryMediaKindDto },
) {
  const dto = validateOrThrow(createStorySchema, { text });
  const activeCount = await prisma.story.count({
    where: { authorId, expiresAt: { gt: new Date() } },
  });
  if (activeCount >= MAX_ACTIVE_STORIES)
    throw new AppError(`Max ${MAX_ACTIVE_STORIES} active stories`, 400);
  const story = await prisma.story.create({
    data: {
      authorId,
      url: media.url,
      kind: media.kind,
      text: dto.text.trim(),
      expiresAt: new Date(Date.now() + STORY_TTL_MS),
    },
    include: storyInclude,
  });
  const [withViewed] = await withViewedState([story], authorId);
  return withViewed;
}

// Feed: own + ACCEPTED friends' active stories, grouped by author.
// Newest group first; stories within a group oldest-first (viewer order).
export async function getStoryFeed(meId: string): Promise<StoryFeedGroup[]> {
  const friendIds = await getFriendIds(meId);
  const authorIds = [meId, ...friendIds];
  const rows = await prisma.story.findMany({
    where: { authorId: { in: authorIds }, expiresAt: { gt: new Date() } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: storyInclude,
  });
  const stories = await withViewedState(rows, meId);
  const byAuthor = new Map<string, StoryWithAuthor[]>();
  for (const s of stories) {
    const list = byAuthor.get(s.authorId) ?? [];
    list.push(s);
    byAuthor.set(s.authorId, list);
  }
  const groups: StoryFeedGroup[] = [...byAuthor.entries()].map(
    ([authorId, list]) => {
      const oldestFirst = [...list].reverse();
      return {
        author: oldestFirst[0].author,
        stories: oldestFirst,
        hasUnseen: oldestFirst.some((s) => !s.viewedByMe && s.authorId !== meId),
      };
    },
  );
  // Sort groups by newest story in group (desc), keep own group first.
  groups.sort((a, b) => {
    if (a.author.id === meId) return -1;
    if (b.author.id === meId) return 1;
    const aNewest = a.stories[a.stories.length - 1].createdAt.getTime();
    const bNewest = b.stories[b.stories.length - 1].createdAt.getTime();
    return bNewest - aNewest;
  });
  return groups;
}

// Stories by one author — friends-only (403 for strangers), active only.
export async function getByAuthor(
  meId: string,
  authorId: string,
): Promise<StoryWithAuthor[]> {
  await ensureCanView(meId, authorId);
  const rows = await prisma.story.findMany({
    where: { authorId, expiresAt: { gt: new Date() } },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    include: storyInclude,
  });
  return withViewedState(rows, meId);
}

// Mark a story as viewed — friends-only. Idempotent (upsert).
export async function markViewed(viewerId: string, storyId: string) {
  const story = await prisma.story.findUnique({
    where: { id: storyId },
    select: { id: true, authorId: true, expiresAt: true },
  });
  if (!story || story.expiresAt <= new Date())
    throw new AppError("Story not found", 404);
  await ensureCanView(viewerId, story.authorId);
  await prisma.storyView.upsert({
    where: { storyId_viewerId: { storyId, viewerId } },
    create: { storyId, viewerId },
    update: {},
  });
  return { id: storyId };
}

// Delete a story — author only. Returns the file url so the controller
// can unlink it from disk.
export async function deleteStory(userId: string, storyId: string) {
  const story = await prisma.story.findUnique({
    where: { id: storyId },
    select: { id: true, authorId: true, url: true },
  });
  if (!story) throw new AppError("Story not found", 404);
  if (story.authorId !== userId)
    throw new AppError("Not allowed to delete this story", 403);
  await prisma.story.delete({ where: { id: storyId } });
  return { id: storyId, url: story.url };
}

// Delete expired stories (and return their urls for disk cleanup).
// Runs on a timer from index.ts; also safe to call manually.
export async function cleanupExpired(): Promise<{ deleted: number }> {
  const expired = await prisma.story.findMany({
    where: { expiresAt: { lte: new Date() } },
    select: { id: true },
  });
  if (expired.length === 0) return { deleted: 0 };
  await prisma.story.deleteMany({
    where: { id: { in: expired.map((s) => s.id) } },
  });
  return { deleted: expired.length };
}
