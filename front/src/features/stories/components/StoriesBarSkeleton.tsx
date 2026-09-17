// StoriesBarSkeleton – dumb loading placeholder for the stories tray. No hooks here.
export default function StoriesBarSkeleton() {
  return (
    <div className="mb-4 flex gap-3 overflow-hidden rounded-2xl border border-gray-200 bg-white p-3 dark:border-zinc-700/80 dark:bg-zinc-900">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex w-16 shrink-0 flex-col items-center gap-1.5">
          <div className="h-14 w-14 animate-pulse rounded-full bg-gray-200 dark:bg-zinc-700" />
          <div className="h-2.5 w-10 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
        </div>
      ))}
    </div>
  )
}
