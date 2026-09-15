// PostSkeleton – loading placeholder mirroring the PostCard shape:
// header row, media block, and text lines. Pure animate-pulse, no data.
export default function PostSkeleton({ withMedia = true }: { withMedia?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900"
    >
      <div className="flex animate-pulse items-center gap-3 px-4 py-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-gray-200 dark:bg-zinc-700" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-zinc-700" />
          <div className="h-2.5 w-1/4 rounded bg-gray-100 dark:bg-zinc-800" />
        </div>
      </div>
      {withMedia && <div className="aspect-square w-full animate-pulse bg-gray-200 dark:bg-zinc-700" />}
      <div className="animate-pulse space-y-2 px-4 py-3">
        <div className="h-3 w-full rounded bg-gray-100 dark:bg-zinc-800" />
        <div className="h-3 w-2/3 rounded bg-gray-100 dark:bg-zinc-800" />
      </div>
    </div>
  )
}
