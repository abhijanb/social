import { baseApi } from '../../app/baseApi'

export type PostAuthor = {
  id: string
  username: string
}

export type Post = {
  id: string
  authorId: string
  text: string
  createdAt: string
  author: PostAuthor
}

export const postsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getFeed: build.query<Post[], { limit?: number; cursor?: string } | void>({
      query: (args) => {
        const params = new URLSearchParams()
        if (args?.limit) params.set('limit', String(args.limit))
        if (args?.cursor) params.set('cursor', args.cursor)
        const qs = params.toString()
        return qs ? `post/feed?${qs}` : 'post/feed'
      },
      providesTags: ['Post'],
    }),
    getUserPosts: build.query<Post[], { authorId: string; limit?: number }>({
      query: ({ authorId, limit }) => {
        const params = new URLSearchParams({ authorId })
        if (limit) params.set('limit', String(limit))
        return `post?${params.toString()}`
      },
      providesTags: ['Post'],
    }),
    createPost: build.mutation<Post, { text: string }>({
      query: (body) => ({ url: 'post', method: 'POST', body }),
      invalidatesTags: ['Post'],
    }),
  }),
})

export const { useGetFeedQuery, useGetUserPostsQuery, useCreatePostMutation } = postsApi
