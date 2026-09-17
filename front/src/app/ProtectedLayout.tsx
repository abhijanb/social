import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth/hooks/useAuth'

// ProtectedLayout – gates app routes on the local auth mirror (backend JWT
// cookie is truth; hooks dispatch logout() on 401 so stale sessions land
// here on re-render). API-error guards stay in pages where needed.
export default function ProtectedLayout() {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Outlet />
}
