import { NavLink } from 'react-router-dom'
import { CountBadge, LiveDot } from './NavBadges'
import { APP_LINKS, desktopLinkClass } from './navLinks'

// DesktopNav – dumb desktop pills for Navbar with request/live badges. No hooks here.
export default function DesktopNav({ pendingCount, anyoneLive }: { pendingCount: number; anyoneLive: boolean }) {
  return (
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
  )
}
