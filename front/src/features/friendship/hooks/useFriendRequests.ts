import { useEffect, useMemo } from 'react'
import { useAuth } from '../../auth/hooks/useAuth'
import { useGetMeQuery } from '../../users/usersApi'
import {
  useGetPendingQuery,
  useAcceptRequestMutation,
  useRemoveRequestMutation,
} from '../friendshipApi'
import { useAppDispatch } from '../../../app/hooks'
import { logout } from '../../auth/authSlice'

function isUnauthorizedError(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 401
}

export function useFriendRequests() {
  const { isAuthenticated } = useAuth()
  const dispatch = useAppDispatch()

  const { data: currentUser, isLoading: isResolvingUser, error: meError } = useGetMeQuery(undefined, {
    skip: !isAuthenticated,
  })

  useEffect(() => {
    if (isUnauthorizedError(meError)) {
      dispatch(logout())
    }
  }, [meError, dispatch])

  const currentUserId = currentUser?.id
  const username = currentUser?.username ?? ''

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
