import { baseApi } from '../../app/baseApi'

export type PresenceInfo = { userId: string; online: boolean; lastSeenAt: string | null }

export const presenceApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getPresence: build.query<PresenceInfo[], string>({
      query: (ids) => `presence?ids=${encodeURIComponent(ids)}`,
      providesTags: ['Presence'],
    }),
  }),
})

export const { useGetPresenceQuery } = presenceApi
