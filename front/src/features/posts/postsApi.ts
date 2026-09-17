import { baseApi } from '../../app/baseApi'
import type { FeedPage, Post, PostComment } from './types'

export type { FeedPage, Post, PostAuthor, PostComment, PostImage, PostMediaKind } from './types'

export const MAX_POST_IMAGES = 10

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
    // Toggle save — no tag invalidation, same chunk-patch reason as likes.
    // No count: saves are fully private, only savedByMe travels.
    toggleSave: build.mutation<{ saved: boolean }, { postId: string }>({
      query: ({ postId }) => ({ url: `post/${postId}/save`, method: 'POST' }),
    }),
    // Own saved posts, newest save first — same envelope as the feed.
    getSavedPosts: build.query<FeedPage, { page?: number } | void>({
      query: (args) => {
        const params = new URLSearchParams()
        if (args?.page) params.set('page', String(args.page))
        const qs = params.toString()
        return qs ? `post/saved?${qs}` : 'post/saved'
      },
      providesTags: ['Post'],
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
    // Delete post — no tag invalidation: useFeed/useProfilePage drop the
    // post from their collected chunks directly (same page-guard reason).
    deletePost: build.mutation<{ id: string }, { postId: string }>({
      query: ({ postId }) => ({ url: `post/${postId}`, method: 'DELETE' }),
    }),
  }),
})

export const { useGetFeedQuery, useGetUserPostsQuery, useCreatePostMutation, useToggleLikeMutation, useToggleSaveMutation, useGetSavedPostsQuery, useGetCommentsQuery, useCreateCommentMutation, useDeleteCommentMutation, useDeletePostMutation } = postsApi
