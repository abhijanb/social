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
    sendMessage: build.mutation<ChatMessage, { receiverId: string; text: string }>({
      query: (body) => ({ url: 'chat/send', method: 'POST', body }),
      invalidatesTags: ['Chat'],
    }),
  }),
})

export const { useGetHistoryQuery, useSendMessageMutation } = chatApi
