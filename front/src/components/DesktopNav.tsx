import { NavLink } from 'react-router-dom'
import { CountBadge } from './NavBadges'
import { APP_LINKS, desktopLinkClass } from './NavLinks'

// DesktopNav – dumb desktop pills for Navbar with request badge. No hooks here.
export default function DesktopNav({ pendingCount }: { pendingCount: number }) {
  return (
    <div className="ml-4 hidden items-center gap-1 sm:flex">
      {APP_LINKS.map(({ to, label, Icon }) => (
        <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => desktopLinkClass(isActive)}>
          <span className="relative">
            <Icon className="h-[18px] w-[18px]" />
              {to === '/requests' && <CountBadge count={pendingCount} />}
          </span>
          {label}
        </NavLink>
      ))}
    </div>
  )
}
