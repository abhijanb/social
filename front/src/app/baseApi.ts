import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
    credentials: 'include',
  }),
  tagTypes: ['User', 'Friendship', 'Presence'],
  endpoints: () => ({}),
})

export const api = baseApi
