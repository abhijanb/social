import { baseApi } from '../../app/baseApi'

export type LivestreamHost = {
  id: string
  username: string
  avatarUrl: string | null
}

export type Livestream = {
  id: string
  hostId: string
  title: string
  status: 'LIVE' | 'ENDED'
  startedAt: string
  endedAt: string | null
  host: LivestreamHost
}

export type LivestreamComment = {
  id: string
  streamId: string
  authorId: string
  text: string
  createdAt: string
  author: LivestreamHost
}

/** Comment poll cadence — live comments refresh every 1.5s. */
export const COMMENT_POLL_MS = 1500

export const livestreamApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getLiveStreams: build.query<Livestream[], void>({
      query: () => 'livestream/live',
      providesTags: ['Livestream'],
    }),
    startStream: build.mutation<Livestream, { title: string }>({
      query: (body) => ({ url: 'livestream/start', method: 'POST', body }),
      invalidatesTags: ['Livestream'],
    }),
    endStream: build.mutation<Livestream, { id: string }>({
      query: ({ id }) => ({ url: `livestream/${id}/end`, method: 'POST' }),
      invalidatesTags: ['Livestream'],
    }),
    // Initial page of comments (oldest first). Deltas are fetched via
    // getCommentDelta below so the 1.5s poll stays cheap.
    getComments: build.query<LivestreamComment[], { streamId: string }>({
      query: ({ streamId }) => `livestream/${streamId}/comments`,
    }),
    // Incremental poll — only comments newer than sinceId.
    getCommentDelta: build.query<LivestreamComment[], { streamId: string; sinceId: string }>({
      query: ({ streamId, sinceId }) => {
        const params = new URLSearchParams({ sinceId })
        return `livestream/${streamId}/comments?${params.toString()}`
      },
    }),
    sendComment: build.mutation<LivestreamComment, { streamId: string; text: string }>({
      query: ({ streamId, text }) => ({
        url: `livestream/${streamId}/comments`,
        method: 'POST',
        body: { text },
      }),
    }),
  }),
})

export const {
  useGetLiveStreamsQuery,
  useStartStreamMutation,
  useEndStreamMutation,
  useGetCommentsQuery,
  useGetCommentDeltaQuery,
  useSendCommentMutation,
} = livestreamApi
