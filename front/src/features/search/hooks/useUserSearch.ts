import { useState } from 'react'
import { useAuth } from '../../auth/hooks/useAuth'
import { useGetUsersQuery } from '../../users/usersApi'
import { useDebounce } from './useDebounce'
import type { User } from '../../users/usersApi'

export function useUserSearch() {
  const { isAuthenticated } = useAuth()
  const [query, setQuery] = useState('')
  const debounced = useDebounce(query, 300)
  const trimmed = debounced.trim()
  const { data: users, isLoading, error } = useGetUsersQuery(trimmed, { skip: !trimmed })

  return {
    isAuthenticated,
    query,
    setQuery,
    debouncedTrimmed: trimmed,
    users: users as User[] | undefined,
    isLoading,
    error,
  }
}
