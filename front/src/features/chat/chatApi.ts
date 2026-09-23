import { baseApi } from '../../app/baseApi'

export type ChatMessage = {
  id: string
  senderId: string
  receiverId: string
  text: string
  createdAt: string
}

export const chatApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getHistory: build.query<ChatMessage[], { friendId: string; limit?: number }>({
      query: ({ friendId, limit }) => {
        const params = new URLSearchParams({ friendId })
        if (limit) params.set('limit', String(limit))
        return `chat/history?${params.toString()}`
      },
      providesTags: ['Chat'],
    }),
    sendMessage: build.mutation<ChatMessage, { receiverId: string; text: string; idempotencyKey?: string }>({
      query: ({ receiverId, text, idempotencyKey }) => {
        const headers: Record<string, string> = {};
        if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
        return { url: 'chat/send', method: 'POST', body: { receiverId, text }, headers }
      },
      invalidatesTags: ['Chat'],
    }),
  }),
})

export const { useGetHistoryQuery, useSendMessageMutation } = chatApi
