import { NavLink } from 'react-router-dom'
import { CountBadge } from './NavBadges'
import { TAB_LINKS } from './NavLinks'

// MobileTabBar – dumb bottom 5-tab bar for Navbar with request badge. No hooks here.
export default function MobileTabBar({ pendingCount }: { pendingCount: number }) {
  return (
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
            </span>
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
