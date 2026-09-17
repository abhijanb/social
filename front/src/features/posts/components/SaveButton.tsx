type Props = {
  postId: string
  savedByMe: boolean
  onToggleSave?: (postId: string) => void
  savePending?: boolean
}

// SaveButton – Instagram-style bookmark toggle. Pure presentational piece
// of PostCard; toggle state lives in the feed hooks. No count by design:
// saves are fully private, only savedByMe travels.
export default function SaveButton({ postId, savedByMe, onToggleSave, savePending = false }: Props) {
  return (
    <button
      onClick={() => onToggleSave?.(postId)}
      disabled={!onToggleSave || savePending}
      aria-label={savedByMe ? 'Unsave this post' : 'Save this post'}
      aria-pressed={savedByMe}
      className={`rounded-full p-1.5 transition active:scale-90 ${
        savedByMe
          ? 'text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300'
          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-white'
      } disabled:cursor-wait disabled:opacity-60`}
    >
      <svg className="h-6 w-6" fill={savedByMe ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
      </svg>
    </button>
  )
}
