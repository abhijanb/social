import Avatar from '../../../components/Avatar'
import { timeAgo, useComments } from '../hooks/useComments'

type Props = {
  postId: string
  postAuthorId: string
  commentsCount: number
  onCommentAdded?: (postId: string) => void
  onCommentDeleted?: (postId: string) => void
}

// CommentSection – fetch-on-open comments for one post: toggle button with
// count, list loaded once on expand, composer + delete. Data + handlers
// live in useComments; this file is props + JSX only.
export default function CommentSection({ postId, postAuthorId, commentsCount, onCommentAdded, onCommentDeleted }: Props) {
  const {
    open,
    setOpen,
    draft,
    setDraft,
    deletingIds,
    comments,
    isLoading,
    isFetching,
    error,
    sessionExpired,
    meId,
    isSending,
    handleSend,
    handleDelete,
  } = useComments({ postId, onCommentAdded, onCommentDeleted })

  return (
    <div className="px-4 pb-3 pt-1">
      {commentsCount > 0 || open ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          {open ? 'Hide comments' : `View all ${commentsCount} ${commentsCount === 1 ? 'comment' : 'comments'}`}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          Be the first to comment
        </button>
      )}

      {open && (
        <div className="mt-2 space-y-2">
          {(isLoading || isFetching) && !comments && (
            <p className="text-sm text-gray-500 dark:text-zinc-400">Loading comments…</p>
          )}
          {error && !sessionExpired && (
            <p className="text-sm text-red-600 dark:text-red-400">Failed to load comments</p>
          )}
          {comments && comments.length === 0 && !isLoading && (
            <p className="text-sm text-gray-500 dark:text-zinc-400">No comments yet</p>
          )}
          {comments?.map((c) => {
            const canDelete = meId != null && (c.authorId === meId || postAuthorId === meId)
            return (
              <div key={c.id} className="flex items-start justify-between gap-2">
                <Avatar username={c.author.username} avatarUrl={c.author.avatarUrl} size="xs" className="mt-0.5" />
                <p className="min-w-0 flex-1 break-words text-sm leading-relaxed text-gray-900 dark:text-zinc-100">
                  <span className="mr-2 font-semibold">{c.author.username}</span>
                  {c.text}
                  <span className="ml-2 text-xs text-gray-500 dark:text-zinc-400">{timeAgo(c.createdAt)}</span>
                </p>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => void handleDelete(c.id)}
                    disabled={deletingIds.has(c.id)}
                    aria-label={`Delete comment by ${c.author.username}`}
                    className="shrink-0 text-xs font-medium text-gray-400 hover:text-red-600 disabled:cursor-wait disabled:opacity-50 dark:text-zinc-500 dark:hover:text-red-400"
                  >
                    {deletingIds.has(c.id) ? '…' : 'Delete'}
                  </button>
                )}
              </div>
            )
          })}

          <div className="flex items-center gap-2 pt-1">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSend()
              }}
              maxLength={500}
              placeholder="Add a comment…"
              aria-label="Add a comment"
              className="min-w-0 flex-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-violet-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500"
            />
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={!draft.trim() || isSending}
              className="shrink-0 text-sm font-semibold text-violet-600 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-violet-400 dark:hover:text-violet-300"
            >
              {isSending ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
