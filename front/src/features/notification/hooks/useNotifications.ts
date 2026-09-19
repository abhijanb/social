import { useEffect } from 'react'
import { useAuth } from '../../auth/hooks/useAuth'
import { useAppDispatch } from '../../../app/hooks'
import { isUnauthorizedError } from '../../../app/apiError'
import { logout } from '../../auth/authSlice'
import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkReadMutation,
  useDeleteNotificationMutation,
} from '../notificationsApi'

// useNotifications – data + actions for the navbar bell dropdown, no JSX.
// Queries are skipped when logged out; a 401 logs out (stale cookie session),
// same pattern as useFriendRequests. Plain REST: refetch on mount only.
export function useNotifications() {
  const { isAuthenticated } = useAuth()
  const dispatch = useAppDispatch()

  const {
    data: notifications,
    isLoading,
    error,
    refetch,
  } = useGetNotificationsQuery(undefined, { skip: !isAuthenticated })

  const { data: unread } = useGetUnreadCountQuery(undefined, {
    skip: !isAuthenticated,
  })

  useEffect(() => {
    if (isUnauthorizedError(error)) {
      dispatch(logout())
    }
  }, [error, dispatch])

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
    markRead,
    remove,
    refetch,
  }
}
