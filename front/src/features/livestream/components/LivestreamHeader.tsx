// LivestreamHeader – dumb title bar for a live room: LIVE badge + title + host. No hooks here.
export default function LivestreamHeader({ title, hostname }: { title: string; hostname: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-gray-200 p-3 dark:border-zinc-700">
      <span className="flex items-center gap-1.5 rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
        LIVE
      </span>
      <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900 dark:text-white">{title}</p>
      <p className="shrink-0 text-xs text-gray-500 dark:text-zinc-400">{hostname}</p>
    </div>
  )
}
