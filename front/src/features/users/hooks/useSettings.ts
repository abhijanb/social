import { useEffect } from 'react'
import { useAppDispatch } from '../../../app/hooks'
import { isUnauthorizedError } from '../../../app/apiError'
import { logout } from '../../auth/authSlice'
import { useAuth } from '../../auth/hooks/useAuth'
import { useGetMeQuery, useUpdateUserMutation } from '../usersApi'

// useSettings – all data + toggle logic for /settings, no JSX:
// auth, own profile, visibility toggle with save state.
export function useSettings() {
  const { isAuthenticated } = useAuth()
  const dispatch = useAppDispatch()
  const { data: me, isLoading, error } = useGetMeQuery(undefined, { skip: !isAuthenticated })
  const [updateUser, { isLoading: isSaving, error: saveError }] = useUpdateUserMutation()

  useEffect(() => {
    if (isUnauthorizedError(error)) dispatch(logout())
  }, [error, dispatch])

  const isPublic = me?.isPublic ?? true

  const handleToggle = async () => {
    try {
      await updateUser({ patch: { isPublic: !isPublic } }).unwrap()
    } catch {
      // error handled via saveError
    }
  }

  return {
    isAuthenticated,
    me,
    isLoading,
    error,
    isPublic,
    isSaving,
    saveError,
    handleToggle,
  }
}
