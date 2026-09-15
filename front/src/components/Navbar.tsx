import type { ComponentType } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { logout } from '../features/auth/authSlice'
import { useFriendRequests } from '../features/friendship/hooks/useFriendRequests'
import { useGetLiveStreamsQuery } from '../features/livestream/livestreamApi'

// --- Icons (heroicons outline style, matching the settings gear) ---

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  )
}

function RequestsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
    </svg>
  )
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  )
}

function LiveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
    </svg>
  )
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
  )
}

// --- Link definitions ---

type NavEntry = {
  to: string
  label: string
  Icon: ComponentType<{ className?: string }>
}

const APP_LINKS: NavEntry[] = [
  { to: '/', label: 'Home', Icon: HomeIcon },
  { to: '/users', label: 'Users', Icon: UsersIcon },
  { to: '/search', label: 'Search', Icon: SearchIcon },
  { to: '/requests', label: 'Requests', Icon: RequestsIcon },
  { to: '/chat', label: 'Chat', Icon: ChatIcon },
  { to: '/live', label: 'Live', Icon: LiveIcon },
]

// Bottom tab bar entries (most-used destinations first).
const TAB_LINKS: NavEntry[] = [
  { to: '/', label: 'Home', Icon: HomeIcon },
  { to: '/search', label: 'Search', Icon: SearchIcon },
  { to: '/chat', label: 'Chat', Icon: ChatIcon },
  { to: '/live', label: 'Live', Icon: LiveIcon },
  { to: '/requests', label: 'Requests', Icon: RequestsIcon },
]

function desktopLinkClass(isActive: boolean): string {
  return `relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
    isActive
      ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300'
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'
  }`
}

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold leading-none text-white">
      {count > 9 ? '9+' : count}
    </span>
  )
}

function LiveDot() {
  return (
    <span className="absolute right-1.5 top-1.5 h-2 w-2 animate-pulse rounded-full bg-red-600 ring-2 ring-white dark:ring-zinc-900" />
  )
}

// Navbar – app navigation shell: icon + label pills with active state on
// desktop, fixed bottom tab bar on mobile. Badges (pending requests, live
// indicator) and links adapt to login state.
export default function Navbar() {
  const username = useAppSelector((state) => state.auth.username)
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const dispatch = useAppDispatch()

  // Badges reuse cached RTK queries (skipped when logged out).
  const { received } = useFriendRequests()
  const { data: liveStreams } = useGetLiveStreamsQuery(undefined, {
    skip: !isAuthenticated,
    pollingInterval: 30000,
    skipPollingIfUnfocused: true,
  })
  const pendingCount = received?.length ?? 0
  const anyoneLive = (liveStreams?.length ?? 0) > 0

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
            {isAuthenticated && (
              <div className="ml-4 hidden items-center gap-1 sm:flex">
                {APP_LINKS.map(({ to, label, Icon }) => (
                  <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => desktopLinkClass(isActive)}>
                    <span className="relative">
                      <Icon className="h-[18px] w-[18px]" />
                      {to === '/requests' && <CountBadge count={pendingCount} />}
                      {to === '/live' && anyoneLive && <LiveDot />}
                    </span>
                    {label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-2 rounded-full bg-gray-100 py-1 pl-1 pr-3 dark:bg-zinc-800 md:flex">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-[#aa3bff] text-[11px] font-semibold text-white">
                  {(username || '?').charAt(0).toUpperCase()}
                </span>
                <span className="max-w-28 truncate text-xs font-medium text-gray-700 dark:text-zinc-200">
                  {username}
                </span>
              </span>
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

      {isAuthenticated && (
        <nav
          aria-label="Primary"
          className="fixed inset-x-0 bottom-0 z-10 border-t border-gray-200 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:border-zinc-700 dark:bg-zinc-900/90 sm:hidden"
        >
          <div className="grid grid-cols-5">
            {TAB_LINKS.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                aria-label={label}
                className={({ isActive }) =>
                  `relative flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition ${
                    isActive
                      ? 'text-violet-600 dark:text-violet-400'
                      : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white'
                  }`
                }
              >
                <span className="relative">
                  <Icon className="h-6 w-6" />
                  {to === '/requests' && <CountBadge count={pendingCount} />}
                  {to === '/live' && anyoneLive && <LiveDot />}
                </span>
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </>
  )
}
