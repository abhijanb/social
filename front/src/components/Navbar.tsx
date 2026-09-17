import { Link } from 'react-router-dom'
import Avatar, { getInitials } from './Avatar'
import DesktopNav from './DesktopNav'
import MobileTabBar from './MobileTabBar'
import { LogoutIcon, SettingsIcon } from './NavbarIcons'
import { useNavbarBadges } from './hooks/useNavbarBadges'
import { useAppDispatch } from '../app/hooks'
import { logout } from '../features/auth/authSlice'

// Navbar – thin app navigation shell: brand + desktop pills + profile
// actions on top, bottom tab bar on mobile. Icons, links, badges, and
// badge data live in sibling components/hook.
export default function Navbar() {
  const dispatch = useAppDispatch()
  const { isAuthenticated, pendingCount, anyoneLive, username, avatarUrl } = useNavbarBadges()

  return (
    <>
      <nav className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-zinc-700 dark:bg-zinc-900/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-[#aa3bff] text-sm font-bold text-white">
                S
              </span>
              <span className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">Social</span>
            </Link>
            {isAuthenticated && <DesktopNav pendingCount={pendingCount} anyoneLive={anyoneLive} />}
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              {username ? (
                <Link
                  to={`/u/${encodeURIComponent(username)}`}
                  className="hidden items-center gap-2 rounded-full bg-gray-100 py-1 pl-1 pr-3 transition hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 md:flex"
                >
                  <Avatar username={username} avatarUrl={avatarUrl} size="xs" />
                  <span className="max-w-28 truncate text-xs font-medium text-gray-700 dark:text-zinc-200">
                    {username}
                  </span>
                </Link>
              ) : (
                <span className="hidden items-center gap-2 rounded-full bg-gray-100 py-1 pl-1 pr-3 dark:bg-zinc-800 md:flex">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-[#aa3bff] text-[11px] font-semibold text-white">
                    {getInitials(username ?? '')}
                  </span>
                </span>
              )}
              <Link
                to="/settings"
                aria-label="Settings"
                className="rounded-full p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
              >
                <SettingsIcon className="h-5 w-5" />
              </Link>
              <button
                onClick={() => dispatch(logout())}
                aria-label="Logout"
                title="Logout"
                className="rounded-full p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
              >
                <LogoutIcon className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-full px-4 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-[#aa3bff] px-4 py-1.5 text-sm font-medium text-white transition hover:bg-[#9835e6] dark:bg-violet-600 dark:hover:bg-violet-700"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </nav>

      {isAuthenticated && <MobileTabBar pendingCount={pendingCount} anyoneLive={anyoneLive} />}
    </>
  )
}
