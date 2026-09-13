import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { logout } from '../authSlice'

export function useAuth() {
  const username = useAppSelector((s) => s.auth.username)
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
  const dispatch = useAppDispatch()

  return {
    username,
    isAuthenticated,
    logout: () => dispatch(logout()),
  }
}
