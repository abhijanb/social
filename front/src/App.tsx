import { Outlet, Link } from 'react-router-dom'
import { useAppSelector } from './app/hooks'

export default function App() {
  const username = useAppSelector((state) => state.auth.username)

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
            <Link to="/login" className="text-sm font-medium text-gray-600 transition hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white">
              Login
            </Link>
            <Link to="/register" className="text-sm font-medium text-gray-600 transition hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white">
              Register
            </Link>
          </div>
          {username && (
            <span className="hidden text-sm text-gray-600 dark:text-zinc-300 sm:inline">
              Welcome, <span className="font-medium text-gray-900 dark:text-white">{username}</span>
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
