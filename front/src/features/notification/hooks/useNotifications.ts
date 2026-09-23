import { useCallback, useEffect } from 'react'
import { useAuth } from '../../auth/hooks/useAuth'
import { useAppDispatch } from '../../../app/hooks'
import { isUnauthorizedError } from '../../../app/apiError'
import { logoutAndReset } from '../../auth/authSlice'
import {
  useLazyGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkReadMutation,
  useMarkAllReadMutation,
  useDeleteNotificationMutation,
} from '../notificationsApi'

// useNotifications – data + actions for the navbar bell dropdown, no JSX.
// The list is lazy (fetched on first bell open via ensureList, not on page
// load); the unread badge stays eager. A 401 logs out (stale cookie
// session), same pattern as useFriendRequests.
export function useNotifications() {
  const { isAuthenticated } = useAuth()
  const dispatch = useAppDispatch()

  const [fetchList, { data: notifications, isLoading, error }] =
    useLazyGetNotificationsQuery()

  const { data: unread } = useGetUnreadCountQuery(undefined, {
    skip: !isAuthenticated,
    // Keep the bell badge fresh without manual refresh.
    pollingInterval: 15000,
    skipPollingIfUnfocused: true,
  })

  useEffect(() => {
    if (isUnauthorizedError(error)) {
      dispatch(logoutAndReset())
    }
  }, [error, dispatch])

  // Fire the list query once per mount (no-op while subscribed).
  const ensureList = useCallback(() => {
    if (isAuthenticated) void fetchList(undefined)
  }, [isAuthenticated, fetchList])

  const [markReadRequest, { isLoading: isMarkingRead, error: markReadError }] = useMarkReadMutation()
  const [markAllReadRequest, { isLoading: isMarkingAllRead, error: markAllReadError }] =
    useMarkAllReadMutation()
  const [deleteRequest, { isLoading: isDeleting, error: removeError }] = useDeleteNotificationMutation()

  const markRead = async (id: string) => {
    try {
      await markReadRequest(id).unwrap()
    } catch {
      // surfaced via actionError below
    }
  }

  const markAllRead = async () => {
    try {
      await markAllReadRequest().unwrap()
    } catch {
      // surfaced via actionError below
    }
  }

  const remove = async (id: string) => {
    try {
      await deleteRequest(id).unwrap()
    } catch {
      // surfaced via actionError below
    }
  }

  return {
    notifications: notifications ?? [],
    unreadCount: unread?.count ?? 0,
    isLoading,
    error,
    actionError: markReadError ?? markAllReadError ?? removeError,
    isMarkingRead,
    isMarkingAllRead,
    isDeleting,
    ensureList,
    markRead,
    markAllRead,
    remove,
  }
}
