import { useCallback, useEffect } from 'react'
import { useAuth } from '../../auth/hooks/useAuth'
import { useAppDispatch } from '../../../app/hooks'
import { isUnauthorizedError } from '../../../app/apiError'
import { logout } from '../../auth/authSlice'
import {
  useLazyGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkReadMutation,
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
  })

  useEffect(() => {
    if (isUnauthorizedError(error)) {
      dispatch(logout())
    }
  }, [error, dispatch])

  // Fire the list query once per mount (no-op while subscribed).
  const ensureList = useCallback(() => {
    if (isAuthenticated) void fetchList(undefined)
  }, [isAuthenticated, fetchList])

  const [markReadRequest, { isLoading: isMarkingRead }] = useMarkReadMutation()
  const [deleteRequest, { isLoading: isDeleting }] = useDeleteNotificationMutation()

  const markRead = async (id: string) => {
    await markReadRequest(id).unwrap()
  }

  const remove = async (id: string) => {
    await deleteRequest(id).unwrap()
  }

  return {
    notifications: notifications ?? [],
    unreadCount: unread?.count ?? 0,
    isLoading,
    error,
    isMarkingRead,
    isDeleting,
    ensureList,
    markRead,
    remove,
  }
}
