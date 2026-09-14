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
            <Link to="/requests" className="text-sm font-medium text-gray-600 transition hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white">
              Requests
            </Link>
            <Link to="/chat" className="text-sm font-medium text-gray-600 transition hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white">
              Chat
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
              <Link
                to="/settings"
                aria-label="Settings"
                className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
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
          <Link to="/requests" className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-zinc-300">
            Requests
          </Link>
          <Link to="/chat" className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-zinc-300">
            Chat
          </Link>
          <Link to="/settings" aria-label="Settings" className="rounded-lg p-1.5 text-gray-600 dark:text-zinc-300">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
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
