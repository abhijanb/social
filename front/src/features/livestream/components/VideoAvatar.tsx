function initials(name: string): string {
  return name.charAt(0).toUpperCase() || '?'
}

// VideoAvatar – gradient initials fallback for video tiles with camera off. No hooks here.
export default function VideoAvatar({ name }: { name: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-500 to-[#aa3bff]">
      <span className="text-2xl font-semibold text-white">{initials(name)}</span>
    </div>
  )
}
