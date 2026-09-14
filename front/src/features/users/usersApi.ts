import { baseApi } from "../../app/baseApi"

export interface User {
  id: string
  username: string
  email?: string | null
  name?: string | null
  createdAt: string
  updatedAt: string
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
    registerUser: build.mutation<User, { username: string; password: string }>({
      query: (body) => ({ url: 'user', method: 'POST', body }),
      invalidatesTags: ['User'],
    }),
    updateUser: build.mutation<User, { id: string; patch: Partial<User> }>({
      query: ({ id, patch }) => ({ url: `user/${id}`, method: 'PATCH', body: patch }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'User', id }, 'User'],
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
  useRegisterUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = usersApi
