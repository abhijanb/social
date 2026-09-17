import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth/hooks/useAuth'

// GuestLayout – keeps logged-in users out of login/register: authed visits
// bounce to the feed, everyone else renders the auth page.
export default function GuestLayout() {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navigate to="/" replace />
  return <Outlet />
}
