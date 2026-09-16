import { baseApi } from '../../app/baseApi'
import type { FeedPage } from './postsApi'

export type HashtagHit = {
  tag: string
  postsCount: number
}

// hashtagsApi – tag autocomplete + friends-only tag feed.
// Reuses FeedPage envelope so TagPage can share PostFeed.
export const hashtagsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    searchTags: build.query<HashtagHit[], { q: string }>({
      query: ({ q }) => `post/hashtags/search?${new URLSearchParams({ q }).toString()}`,
    }),
    getTagPosts: build.query<FeedPage, { tag: string; page?: number }>({
      query: ({ tag, page }) => {
        const params = new URLSearchParams({ tag })
        if (page) params.set('page', String(page))
        return `post/by-hashtag?${params.toString()}`
      },
      providesTags: (_result, _error, arg) => [{ type: 'Post', id: `tag-${arg.tag.toLowerCase()}` }],
    }),
  }),
})

export const { useSearchTagsQuery, useGetTagPostsQuery } = hashtagsApi
