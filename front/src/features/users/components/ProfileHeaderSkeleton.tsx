// ProfileHeaderSkeleton – dumb loading placeholder for the /u/:username header. No hooks here.
export default function ProfileHeaderSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-zinc-700" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-40 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
          <div className="h-3 w-64 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
        </div>
      </div>
    </div>
  )
}
