import { baseApi } from '../../app/baseApi'
import type { Notification } from './types'

// Contract implemented by the backend (cookie-JWT auth, enveloped responses
// unwrapped in baseApi): list own non-deleted newest-first, unread count,
// mark-read, soft-delete.
export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getNotifications: build.query<Notification[], void>({
      query: () => 'notification',
      providesTags: ['Notification'],
    }),
    getUnreadCount: build.query<{ count: number }, void>({
      query: () => 'notification/unread-count',
      providesTags: ['Notification'],
    }),
    markRead: build.mutation<Notification, string>({
      query: (id) => ({ url: `notification/${id}/read`, method: 'PATCH' }),
      invalidatesTags: ['Notification'],
    }),
    markAllRead: build.mutation<{ count: number }, void>({
      query: () => ({ url: 'notification/read-all', method: 'PATCH' }),
      invalidatesTags: ['Notification'],
    }),
    deleteNotification: build.mutation<void, string>({
      query: (id) => ({ url: `notification/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Notification'],
    }),
  }),
})

export const {
  useGetNotificationsQuery,
  useLazyGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkReadMutation,
  useMarkAllReadMutation,
  useDeleteNotificationMutation,
} = notificationsApi
