import { baseApi } from '../../app/baseApi'

export type PostAuthor = {
  id: string
  username: string
}

export type PostMediaKind = 'IMAGE' | 'VIDEO'

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

export const MAX_POST_IMAGES = 10
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024
export const ACCEPT_MEDIA = 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm'

export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/')
}

export type FeedPage = {
  posts: Post[]
  /** Next page number, or null when there are no more pages. */
  nextPage: number | null
}

export const postsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getFeed: build.query<FeedPage, { page?: number } | void>({
      query: (args) => {
        const params = new URLSearchParams()
        if (args?.page) params.set('page', String(args.page))
        const qs = params.toString()
        return qs ? `post/feed?${qs}` : 'post/feed'
      },
      providesTags: ['Post'],
    }),
    getUserPosts: build.query<FeedPage, { authorId: string; page?: number }>({
      query: ({ authorId, page }) => {
        const params = new URLSearchParams({ authorId })
        if (page) params.set('page', String(page))
        return `post?${params.toString()}`
      },
      providesTags: ['Post'],
    }),
    createPost: build.mutation<Post, { text: string; images?: File[] | null }>({
      query: ({ text, images }) => {
        const form = new FormData()
        form.set('text', text)
        for (const file of (images ?? []).slice(0, MAX_POST_IMAGES)) form.append('images', file)
        return { url: 'post', method: 'POST', body: form }
      },
      invalidatesTags: ['Post'],
    }),
    // Toggle like — no tag invalidation: FeedPage patches its collected
    // chunks directly (its page guard would swallow refetch updates).
    toggleLike: build.mutation<{ liked: boolean; likesCount: number }, { postId: string }>({
      query: ({ postId }) => ({ url: `post/${postId}/like`, method: 'POST' }),
    }),
    // Comments — fetch-on-open only (no polling). Per-post tag so creating
    // a comment refetches just that post's list; never invalidates 'Post'
    // (same page-guard reason as toggleLike — FeedPage patches counts locally).
    getComments: build.query<PostComment[], { postId: string }>({
      query: ({ postId }) => `post/${postId}/comments`,
      providesTags: (_result, _error, arg) => [{ type: 'Post', id: `comments-${arg.postId}` }],
    }),
    createComment: build.mutation<PostComment, { postId: string; text: string }>({
      query: ({ postId, text }) => ({ url: `post/${postId}/comments`, method: 'POST', body: { text } }),
      invalidatesTags: (_result, _error, arg) => [{ type: 'Post', id: `comments-${arg.postId}` }],
    }),
    // Delete filters the cached list optimistically — no refetch GET.
    // Count sync stays via onCommentDeleted → FeedPage.patchPost.
    deleteComment: build.mutation<{ id: string }, { postId: string; commentId: string }>({
      query: ({ postId, commentId }) => ({ url: `post/${postId}/comments/${commentId}`, method: 'DELETE' }),
      async onQueryStarted({ postId, commentId }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          postsApi.util.updateQueryData('getComments', { postId }, (draft) =>
            draft.filter((c) => c.id !== commentId),
          ),
        )
        try {
          await queryFulfilled
        } catch {
          patch.undo()
        }
      },
    }),
  }),
})

export const { useGetFeedQuery, useGetUserPostsQuery, useCreatePostMutation, useToggleLikeMutation, useGetCommentsQuery, useCreateCommentMutation, useDeleteCommentMutation } = postsApi
