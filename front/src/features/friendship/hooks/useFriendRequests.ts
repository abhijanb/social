import { useMemo } from 'react'
import { useAuth } from '../../auth/hooks/useAuth'
import { useGetUsersQuery } from '../../users/usersApi'
import {
  useGetPendingQuery,
  useAcceptRequestMutation,
  useRemoveRequestMutation,
} from '../friendshipApi'

export function useFriendRequests() {
  const { isAuthenticated, username } = useAuth()

  const { data: users, isLoading: isResolvingUser } = useGetUsersQuery(username, {
    skip: !isAuthenticated || !username,
  })

  const currentUser = useMemo(() => {
    if (!users || !username) return undefined
    return users.find((u) => u.username === username)
  }, [users, username])

  const currentUserId = currentUser?.id

  const {
    data: pending,
    isLoading: isLoadingPending,
    error: pendingError,
    isFetching,
  } = useGetPendingQuery(currentUserId!, { skip: !currentUserId })

  const [acceptRequest, { isLoading: isAccepting }] = useAcceptRequestMutation()
  const [removeRequest, { isLoading: isRemoving }] = useRemoveRequestMutation()

  const sent = useMemo(() => {
    if (!pending || !currentUserId) return []
    return pending.filter((p) => p.requesterId === currentUserId)
  }, [pending, currentUserId])

  const received = useMemo(() => {
    if (!pending || !currentUserId) return []
    return pending.filter((p) => p.addresseeId === currentUserId)
  }, [pending, currentUserId])

  const isLoading = isResolvingUser || isLoadingPending || isFetching

  const accept = async (id: string) => {
    if (!currentUserId) return
    await acceptRequest({ id, userId: currentUserId }).unwrap()
  }

  const cancel = async (id: string) => {
    await removeRequest(id).unwrap()
  }

  const decline = cancel

  return {
    isAuthenticated,
    username,
    currentUserId,
    isResolvingUser,
    pending,
    sent,
    received,
    isLoading,
    error: pendingError,
    isAccepting,
    isRemoving,
    accept,
    cancel,
    decline,
  }
}
