// PostFeedEnd – dumb "caught up" divider for PostFeed. No hooks here.
export default function PostFeedEnd() {
  return (
    <div className="flex items-center gap-3 py-4">
      <div className="h-px flex-1 bg-gray-200 dark:bg-zinc-700" />
      <p className="text-xs font-medium text-gray-400 dark:text-zinc-500">You&apos;re all caught up</p>
      <div className="h-px flex-1 bg-gray-200 dark:bg-zinc-700" />
    </div>
  )
}
