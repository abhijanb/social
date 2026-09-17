// Post payload shapes + limits – extracted from post.service (endpoints-only now).
// Re-exported there so existing imports keep working untouched.

/** Max attachments per post — mirrors multer MAX_IMAGES in post.upload.ts. */
export const MAX_POST_IMAGES = 10;

/** Server-owned page size – clients cannot dictate it via query params. */
export const FEED_PAGE_SIZE = 20;

export type PostMediaKindDto = "IMAGE" | "VIDEO";

export type PostMediaInput = {
  url: string;
  kind: PostMediaKindDto;
};

export type PostImageDto = {
  id: string;
  url: string;
  kind: PostMediaKindDto;
  order: number;
};

export type PostWithAuthor = {
  id: string;
  authorId: string;
  text: string;
  createdAt: Date;
  author: { id: string; username: string; avatarUrl: string | null };
  images: PostImageDto[];
  likesCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  commentsCount: number;
};

export type FeedPage = {
  posts: PostWithAuthor[];
  /** Next page number, or null when there are no more pages. */
  nextPage: number | null;
};
