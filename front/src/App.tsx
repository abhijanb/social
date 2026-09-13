import { Outlet, Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from './app/hooks'
import { logout } from './features/auth/authSlice'

export default function App() {
  const username = useAppSelector((state) => state.auth.username)
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const dispatch = useAppDispatch()

  return (
    <div className="min-h-screen bg-white dark:bg-[#16171d]">
      <nav className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white/80 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-zinc-700 dark:bg-zinc-900/80 sm:px-6">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">
            Social
          </Link>
          <div className="hidden items-center gap-4 sm:flex">
            <Link to="/" className="text-sm font-medium text-gray-600 transition hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white">
              Home
            </Link>
            <Link to="/users" className="text-sm font-medium text-gray-600 transition hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white">
              Users
            </Link>
            <Link to="/login" className="text-sm font-medium text-gray-600 transition hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white">
              Login
            </Link>
            <Link to="/register" className="text-sm font-medium text-gray-600 transition hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white">
              Register
            </Link>
          </div>
          {isAuthenticated && (
            <span className="hidden items-center gap-3 text-sm text-gray-600 dark:text-zinc-300 sm:inline-flex">
              Welcome, <span className="font-medium text-gray-900 dark:text-white">{username}</span>
              <button
                onClick={() => dispatch(logout())}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
              >
                Logout
              </button>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 sm:hidden">
          <Link to="/login" className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-zinc-300">
            Login
          </Link>
          <Link to="/register" className="rounded-lg bg-[#aa3bff] px-3 py-1.5 text-sm font-medium text-white dark:bg-violet-600">
            Register
          </Link>
        </div>
      </nav>
      <Outlet />
    </div>
  )
}
