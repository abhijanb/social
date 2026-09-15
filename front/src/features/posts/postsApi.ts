import { baseApi } from '../../app/baseApi'

export type PostAuthor = {
  id: string
  username: string
}

export type PostImage = {
  id: string
  url: string
  order: number
}

export type Post = {
  id: string
  authorId: string
  text: string
  images: PostImage[]
  createdAt: string
  author: PostAuthor
}

export const MAX_POST_IMAGES = 10

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
  }),
})

export const { useGetFeedQuery, useGetUserPostsQuery, useCreatePostMutation } = postsApi
