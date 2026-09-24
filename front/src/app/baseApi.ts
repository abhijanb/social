import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react'
import { getApiBaseUrl } from './config'

const rawBaseQuery = fetchBaseQuery({
  baseUrl: getApiBaseUrl(),
  credentials: 'include',
})

// Unwraps the Express envelope { status: 'success', message, data } so
// slices keep working with raw payloads (Post, User, FeedPage, ...).
// Non-enveloped bodies pass through untouched; error envelopes pass
// through as-is (message stays top-level for the auth hooks).
const baseQueryWithUnwrap: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions)
  if (
    result.data &&
    typeof result.data === 'object' &&
    (result.data as { status?: unknown }).status === 'success' &&
    'data' in result.data
  ) {
    return { data: (result.data as { data: unknown }).data }
  }
  return result
}

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithUnwrap,
  tagTypes: ['User', 'Friendship', 'Presence', 'Chat', 'Post', 'Livestream', 'Story', 'Notification', 'Session'],
  endpoints: () => ({}),
})

export const api = baseApi
