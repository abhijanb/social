// PostFeedEmpty – dumb empty state for PostFeed. No hooks here.
export default function PostFeedEmpty() {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-gray-300 px-6 py-12 text-center dark:border-zinc-600">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-[#aa3bff]">
        <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      </div>
      <p className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">No posts yet</p>
      <p className="mx-auto mt-1 max-w-xs text-sm text-gray-500 dark:text-zinc-400">
        Share your first moment above, or find friends from search to fill your feed
      </p>
    </div>
  )
}
