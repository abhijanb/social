import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/hooks/useAuth'
import { useGetUsersQuery } from '../../users/usersApi'
import { useDebounce } from './useDebounce'
import type { User } from '../../users/usersApi'
import { useAppDispatch } from '../../../app/hooks'
import { logout } from '../../auth/authSlice'

function isUnauthorizedError(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 401
}

export function useUserSearch() {
  const { isAuthenticated, logout: doLogout } = useAuth()
  const dispatch = useAppDispatch()
  const [query, setQuery] = useState('')
  const debounced = useDebounce(query, 300)
  const trimmed = debounced.trim()
  const { data: users, isLoading, error } = useGetUsersQuery(trimmed, { skip: !trimmed })

  const isSessionExpired = isUnauthorizedError(error)

  useEffect(() => {
    if (isSessionExpired) {
      dispatch(logout())
    }
  }, [isSessionExpired, dispatch])

  return {
    isAuthenticated: isAuthenticated && !isSessionExpired,
    query,
    setQuery,
    debouncedTrimmed: trimmed,
    users: users as User[] | undefined,
    isLoading,
    error,
    isSessionExpired,
    logout: doLogout,
  }
}
