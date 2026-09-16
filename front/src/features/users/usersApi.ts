import { baseApi } from "../../app/baseApi"

export interface User {
  id: string
  username: string
  bio: string
  displayName: string | null
  isPublic: boolean
  email?: string | null
  name?: string | null
  createdAt: string
  updatedAt: string
}

export interface ProfileRelation {
  isSelf: boolean
  isFriend: boolean
  pending: boolean
  canViewPosts: boolean
}

export interface Profile {
  user: User
  stats: { posts: number; friends: number; storiesActive: number }
  relation: ProfileRelation
}

export const usersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getUsers: build.query<User[], string | void>({
      query: (search) => (search ? `user?search=${encodeURIComponent(search)}` : 'user'),
      providesTags: ['User'],
    }),
    getUserById: build.query<User, string>({
      query: (id) => `user/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'User', id }],
    }),
    getMe: build.query<User, void>({
      query: () => 'user/me',
      providesTags: ['User'],
    }),
    getProfile: build.query<Profile, string>({
      query: (username) => `user/by-username/${encodeURIComponent(username)}`,
      providesTags: (_result, _error, username) => [
        { type: 'User', id: `profile-${username.toLowerCase()}` },
      ],
    }),
    registerUser: build.mutation<User, { username: string; password: string }>({
      query: (body) => ({ url: 'user', method: 'POST', body }),
      invalidatesTags: ['User'],
    }),
    updateUser: build.mutation<User, { patch: Partial<User> }>({
      query: ({ patch }) => ({ url: `user/me`, method: 'PATCH', body: patch }),
      invalidatesTags: ['User'],
    }),
    deleteUser: build.mutation<void, string>({
      query: (id) => ({ url: `user/${id}`, method: 'DELETE' }),
      invalidatesTags: ['User'],
    }),
  }),
})

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useGetMeQuery,
  useGetProfileQuery,
  useRegisterUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = usersApi
