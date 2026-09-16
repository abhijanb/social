import { baseApi } from "../../app/baseApi"

export type FriendshipStatus = 'PENDING' | 'ACCEPTED' | 'BLOCKED'

export interface FriendshipUser {
  id: string
  username: string
  avatarUrl: string | null
}

export interface FriendshipPending {
  id: string
  requesterId: string
  addresseeId: string
  status: FriendshipStatus
  createdAt: string
  updatedAt: string
  requester: FriendshipUser
  addressee: FriendshipUser
}

export type FriendshipFriend = {
  friendshipId: string
  friend: FriendshipUser & { createdAt: string }
  status: FriendshipStatus
  createdAt: string
}

export const friendshipApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getFriends: build.query<FriendshipFriend[], string>({
      query: (userId) => `friendship?userId=${encodeURIComponent(userId)}`,
      providesTags: ['Friendship'],
    }),
    getPending: build.query<FriendshipPending[], string>({
      query: (userId) => `friendship/pending?userId=${encodeURIComponent(userId)}`,
      providesTags: ['Friendship'],
    }),
    sendRequest: build.mutation<FriendshipPending, { requesterId: string; addresseeId: string }>({
      query: (body) => ({ url: 'friendship', method: 'POST', body }),
      invalidatesTags: ['Friendship'],
    }),
    acceptRequest: build.mutation<FriendshipPending, { id: string; userId: string }>({
      query: ({ id, userId }) => ({ url: `friendship/${id}/accept`, method: 'PATCH', body: { userId } }),
      invalidatesTags: ['Friendship'],
    }),
    removeRequest: build.mutation<void, string>({
      query: (id) => ({ url: `friendship/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Friendship'],
    }),
  }),
})

export const {
  useGetFriendsQuery,
  useGetPendingQuery,
  useSendRequestMutation,
  useAcceptRequestMutation,
  useRemoveRequestMutation,
} = friendshipApi
