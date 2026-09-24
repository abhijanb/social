import { useEffect } from 'react'
import { useAppDispatch } from '../../../app/hooks'
import { isUnauthorizedError } from '../../../app/apiError'
import { logoutAndReset } from '../authSlice'
import { useAuth } from './useAuth'
import {
  useGetSessionsQuery,
  useLogoutAllSessionsMutation,
  useRevokeSessionMutation,
} from '../authApi'

// useSessions – data + actions for the Settings "Active sessions" card.
// Revoked rows stay visible with their revokedAt stamp until purged.
export function useSessions() {
  const { isAuthenticated } = useAuth()
  const dispatch = useAppDispatch()
  const { data, isLoading, error, refetch } = useGetSessionsQuery(undefined, {
    skip: !isAuthenticated,
  })
  const [logoutAll, { isLoading: isLoggingOutOthers, error: logoutAllError }] =
    useLogoutAllSessionsMutation()
  const [revoke, { error: revokeError }] = useRevokeSessionMutation()

  useEffect(() => {
    if (isUnauthorizedError(error)) dispatch(logoutAndReset())
  }, [error, dispatch])

  const handleLogoutOthers = async () => {
    try {
      await logoutAll().unwrap()
    } catch {
      // surfaced via logoutAllError
    }
  }

  const handleRevoke = async (id: string) => {
    try {
      await revoke(id).unwrap()
    } catch {
      // surfaced via revokeError
    }
  }

  return {
    sessions: data ?? [],
    isLoading,
    error,
    refetch,
    handleLogoutOthers,
    isLoggingOutOthers,
    logoutAllError,
    handleRevoke,
    revokeError,
  }
}
