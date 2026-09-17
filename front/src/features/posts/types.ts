import type { ApiMiniUser, MediaKind } from '../../app/apiTypes'

// Post payload shapes – extracted from postsApi (endpoints-only now).
// Re-exported there so existing imports keep working untouched.
export type PostAuthor = ApiMiniUser

export type PostMediaKind = MediaKind

export type PostImage = {
  id: string
  url: string
  kind: PostMediaKind
  order: number
}

export type Post = {
  id: string
  authorId: string
  text: string
  images: PostImage[]
  likesCount: number
  likedByMe: boolean
  commentsCount: number
  createdAt: string
  author: PostAuthor
}

export type PostComment = {
  id: string
  postId: string
  authorId: string
  text: string
  createdAt: string
  author: PostAuthor
}

export type FeedPage = {
  posts: Post[]
  /** Next page number, or null when there are no more pages. */
  nextPage: number | null
}
