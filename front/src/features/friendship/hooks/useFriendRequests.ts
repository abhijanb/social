import { useEffect, useMemo } from 'react'
import { useAuth } from '../../auth/hooks/useAuth'
import { useGetMeQuery } from '../../users/usersApi'
import {
  useGetPendingQuery,
  useAcceptRequestMutation,
  useRemoveRequestMutation,
} from '../friendshipApi'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { isUnauthorizedError } from '../../../app/apiError'
import { logoutAndReset } from '../../auth/authSlice'

export function useFriendRequests() {
  const { isAuthenticated } = useAuth()
  const dispatch = useAppDispatch()

  const { data: currentUser, isLoading: isResolvingUser, error: meError } = useGetMeQuery(undefined, {
    skip: !isAuthenticated,
  })

  useEffect(() => {
    if (isUnauthorizedError(meError)) {
      dispatch(logoutAndReset())
    }
  }, [meError, dispatch])

  const currentUserId = currentUser?.id
  // Cached id from login lets pending fire in parallel with getMe on cold
  // load (no waterfall); getMe reconciles above and the query re-fires if
  // the id ever differs.
  const cachedUserId = useAppSelector((s) => s.auth.userId)
  const userId = currentUserId || cachedUserId || undefined

  const {
    data: pending,
    isLoading: isLoadingPending,
    error: pendingError,
    isFetching,
  } = useGetPendingQuery(userId!, { skip: !userId })

  const [acceptRequest, { isLoading: isAccepting, error: acceptError }] = useAcceptRequestMutation()
  const [removeRequest, { isLoading: isRemoving, error: removeError }] = useRemoveRequestMutation()

  const sent = useMemo(() => {
    if (!pending || !userId) return []
    return pending.filter((p) => p.requesterId === userId)
  }, [pending, userId])

  const received = useMemo(() => {
    if (!pending || !userId) return []
    return pending.filter((p) => p.addresseeId === userId)
  }, [pending, userId])

  const isLoading = isResolvingUser || isLoadingPending || isFetching

  const accept = async (id: string) => {
    try {
      await acceptRequest(id).unwrap()
    } catch {
      // surfaced via acceptError below
    }
  }

  const cancel = async (id: string) => {
    try {
      await removeRequest(id).unwrap()
    } catch {
      // surfaced via removeError below
    }
  }

  const decline = cancel

  return {
    currentUserId,
    isResolvingUser,
    pending,
    sent,
    received,
    isLoading,
    error: pendingError,
    acceptError,
    removeError,
    isAccepting,
    isRemoving,
    accept,
    cancel,
    decline,
  }
}
