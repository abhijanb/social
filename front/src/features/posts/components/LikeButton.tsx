type Props = {
  postId: string
  likedByMe: boolean
  likesCount: number
  /** Whether the post has a caption below (controls bottom padding). */
  hasCaption: boolean
  onToggleLike?: (postId: string) => void
  likePending?: boolean
}

// LikeButton – Instagram-style like unit: heart button + likes count.
// Pure presentational piece of PostCard; toggle state lives in FeedPage.
export default function LikeButton({
  postId,
  likedByMe,
  likesCount,
  hasCaption,
  onToggleLike,
  likePending = false,
}: Props) {
  return (
    <>
      <div className="flex items-center gap-1 px-3 pt-2">
        <button
          onClick={() => onToggleLike?.(postId)}
          disabled={!onToggleLike || likePending}
          aria-label={likedByMe ? 'Unlike this post' : 'Like this post'}
          aria-pressed={likedByMe}
          className={`rounded-full p-1.5 transition active:scale-90 ${
            likedByMe
              ? 'text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-white'
          } disabled:cursor-wait disabled:opacity-60`}
        >
          <svg className="h-6 w-6" fill={likedByMe ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </button>
      </div>
      {likesCount > 0 && (
        <p className={`px-4 pt-1 text-sm font-semibold text-gray-900 dark:text-white ${hasCaption ? '' : 'pb-3'}`}>
          {likesCount} {likesCount === 1 ? 'like' : 'likes'}
        </p>
      )}
    </>
  )
}
