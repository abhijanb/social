import { baseApi } from "../../app/baseApi"
import type { User } from "../users/usersApi"

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    loginUser: build.mutation<User, { username: string; password: string }>({
      query: (body) => ({ url: 'user/login', method: 'POST', body }),
      invalidatesTags: ['User'],
    }),
    logoutUser: build.mutation<void, void>({
      query: () => ({ url: 'user/logout', method: 'POST' }),
    }),
  }),
})

export const { useLoginUserMutation, useLogoutUserMutation } = authApi
