import { baseApi } from '../../app/baseApi'
import type { ApiMiniUser, MediaKind } from '../../app/apiTypes'

export type StoryAuthor = ApiMiniUser

export type StoryMediaKind = MediaKind

export type Story = {
  id: string
  authorId: string
  url: string
  kind: StoryMediaKind
  text: string
  expiresAt: string
  createdAt: string
  author: StoryAuthor
  viewsCount: number
  viewedByMe: boolean
}

export type StoryFeedGroup = {
  author: StoryAuthor
  stories: Story[]
  hasUnseen: boolean
}

export const storiesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getStoryFeed: build.query<StoryFeedGroup[], void>({
      query: () => 'story/feed',
      providesTags: ['Story'],
    }),
    getAuthorStories: build.query<Story[], { authorId: string }>({
      query: ({ authorId }) => {
        const params = new URLSearchParams({ authorId })
        return `story?${params.toString()}`
      },
      providesTags: ['Story'],
    }),
    createStory: build.mutation<Story, { text?: string; media: File; idempotencyKey?: string }>({
      query: ({ text, media, idempotencyKey }) => {
        const form = new FormData()
        form.set('text', text ?? '')
        form.set('media', media)
        const headers: Record<string, string> = {}
        if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey
        return { url: 'story', method: 'POST', body: form, headers }
      },
      invalidatesTags: ['Story'],
    }),
    markStoryViewed: build.mutation<{ id: string }, { storyId: string }>({
      query: ({ storyId }) => ({ url: `story/${storyId}/view`, method: 'POST' }),
      invalidatesTags: ['Story'],
    }),
    deleteStory: build.mutation<{ id: string }, { storyId: string }>({
      query: ({ storyId }) => ({ url: `story/${storyId}`, method: 'DELETE' }),
      invalidatesTags: ['Story'],
    }),
  }),
})

export const {
  useGetStoryFeedQuery,
  useGetAuthorStoriesQuery,
  useCreateStoryMutation,
  useMarkStoryViewedMutation,
  useDeleteStoryMutation,
} = storiesApi
