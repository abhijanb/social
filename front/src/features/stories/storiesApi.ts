import { baseApi } from '../../app/baseApi'

export type StoryAuthor = {
  id: string
  username: string
}

export type StoryMediaKind = 'IMAGE' | 'VIDEO'

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

export const MAX_STORY_BYTES_IMAGE = 5 * 1024 * 1024
export const MAX_STORY_BYTES_VIDEO = 50 * 1024 * 1024
export const ACCEPT_STORY_MEDIA = 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm'

export function isStoryVideoFile(file: File): boolean {
  return file.type.startsWith('video/')
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
    createStory: build.mutation<Story, { text?: string; media: File }>({
      query: ({ text, media }) => {
        const form = new FormData()
        form.set('text', text ?? '')
        form.set('media', media)
        return { url: 'story', method: 'POST', body: form }
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
