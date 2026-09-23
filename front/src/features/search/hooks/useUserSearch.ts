import { useEffect, useState } from 'react'
import { useGetUsersQuery } from '../../users/usersApi'
import { useDebounce } from './useDebounce'
import type { User } from '../../users/usersApi'
import { useAppDispatch } from '../../../app/hooks'
import { isUnauthorizedError } from '../../../app/apiError'
import { logoutAndReset } from '../../auth/authSlice'

export function useUserSearch() {
  const dispatch = useAppDispatch()
  const [query, setQuery] = useState('')
  const debounced = useDebounce(query, 300)
  const trimmed = debounced.trim()
  const { data: users, isLoading, error } = useGetUsersQuery(trimmed, { skip: !trimmed })

  const isSessionExpired = isUnauthorizedError(error)

  useEffect(() => {
    if (isSessionExpired) {
      dispatch(logoutAndReset())
    }
  }, [isSessionExpired, dispatch])

  return {
    query,
    setQuery,
    debouncedTrimmed: trimmed,
    users: users as User[] | undefined,
    isLoading,
    error,
    isSessionExpired,
  }
}
