import type { ComponentType } from 'react'
import { ChatIcon, HomeIcon, LiveIcon, RequestsIcon, SearchIcon, UsersIcon } from './NavbarIcons'

export type NavEntry = {
  to: string
  label: string
  Icon: ComponentType<{ className?: string }>
}

export const APP_LINKS: NavEntry[] = [
  { to: '/', label: 'Home', Icon: HomeIcon },
  { to: '/users', label: 'Users', Icon: UsersIcon },
  { to: '/search', label: 'Search', Icon: SearchIcon },
  { to: '/requests', label: 'Requests', Icon: RequestsIcon },
  { to: '/chat', label: 'Chat', Icon: ChatIcon },
  { to: '/live', label: 'Live', Icon: LiveIcon },
]

// Bottom tab bar entries (most-used destinations first).
export const TAB_LINKS: NavEntry[] = [
  { to: '/', label: 'Home', Icon: HomeIcon },
  { to: '/search', label: 'Search', Icon: SearchIcon },
  { to: '/chat', label: 'Chat', Icon: ChatIcon },
  { to: '/live', label: 'Live', Icon: LiveIcon },
  { to: '/requests', label: 'Requests', Icon: RequestsIcon },
]

export function desktopLinkClass(isActive: boolean): string {
  return `relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
    isActive
      ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300'
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'
  }`
}
