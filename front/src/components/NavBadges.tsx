// NavBadges – dumb badge for Navbar: request count. No hooks here.
export function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold leading-none text-white">
      {count > 9 ? '9+' : count}
    </span>
  )
}
