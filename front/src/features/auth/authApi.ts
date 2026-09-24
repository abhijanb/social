import { baseApi } from "../../app/baseApi"
import type { User } from "../users/usersApi"

export interface Session {
  id: string
  createdAt: string
  lastSeenAt: string
  expiresAt: string
  revokedAt: string | null
  userAgent: string | null
  ip: string | null
  current: boolean
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    loginUser: build.mutation<User, { username: string; password: string }>({
      query: (body) => ({ url: 'user/login', method: 'POST', body }),
      invalidatesTags: ['User', 'Session'],
    }),
    logoutUser: build.mutation<void, void>({
      query: () => ({ url: 'user/logout', method: 'POST' }),
    }),
    logoutAllSessions: build.mutation<{ success: boolean; revoked: number }, void>({
      query: () => ({ url: 'user/logout-all', method: 'POST' }),
      invalidatesTags: ['Session'],
    }),
    getSessions: build.query<Session[], void>({
      query: () => ({ url: 'user/sessions', method: 'GET' }),
      providesTags: ['Session'],
    }),
    revokeSession: build.mutation<void, string>({
      query: (id) => ({ url: `user/sessions/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Session'],
    }),
    verifyEmail: build.query<{ success: boolean }, string>({
      query: (token) => ({ url: 'user/verify-email?token=' + encodeURIComponent(token), method: 'GET' }),
    }),
  }),
})

export const {
  useLoginUserMutation,
  useLogoutUserMutation,
  useLogoutAllSessionsMutation,
  useGetSessionsQuery,
  useRevokeSessionMutation,
  useVerifyEmailQuery,
} = authApi
