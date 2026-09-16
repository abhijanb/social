// NavBadges – dumb badges for Navbar: request count + live indicator. No hooks here.
export function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold leading-none text-white">
      {count > 9 ? '9+' : count}
    </span>
  )
}

export function LiveDot() {
  return (
    <span className="absolute right-1.5 top-1.5 h-2 w-2 animate-pulse rounded-full bg-red-600 ring-2 ring-white dark:ring-zinc-900" />
  )
}
