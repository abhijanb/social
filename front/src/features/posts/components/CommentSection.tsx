import { useEffect, useState } from 'react'
import { useAppDispatch } from '../../../app/hooks'
import { logout } from '../../auth/authSlice'
import { useCreateCommentMutation, useGetCommentsQuery } from '../postsApi'

function isUnauthorizedError(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 401
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return new Date(iso).toLocaleDateString()
}

type Props = {
  postId: string
  commentsCount: number
  onCommentAdded?: (postId: string) => void
}

// CommentSection – fetch-on-open comments for one post: toggle button with
// count, list loaded once on expand, composer with instant refetch via tag
// invalidation. Create + list only (no delete, no polling).
export default function CommentSection({ postId, commentsCount, onCommentAdded }: Props) {
  const dispatch = useAppDispatch()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const { data: comments, isLoading, isFetching, error } = useGetCommentsQuery({ postId }, { skip: !open })
  const [createComment, { isLoading: isSending }] = useCreateCommentMutation()

  const sessionExpired = isUnauthorizedError(error)
  useEffect(() => {
    if (sessionExpired) dispatch(logout())
  }, [sessionExpired, dispatch])

  const handleSend = async () => {
    const trimmed = draft.trim()
    if (!trimmed || isSending) return
    try {
      await createComment({ postId, text: trimmed.slice(0, 500) }).unwrap()
      setDraft('')
      onCommentAdded?.(postId)
    } catch {
      // RTK Query surfaces field errors via the list query; keep draft so retry is easy.
    }
  }

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
          {comments?.map((c) => (
            <p key={c.id} className="break-words text-sm leading-relaxed text-gray-900 dark:text-zinc-100">
              <span className="mr-2 font-semibold">{c.author.username}</span>
              {c.text}
              <span className="ml-2 text-xs text-gray-500 dark:text-zinc-400">{timeAgo(c.createdAt)}</span>
            </p>
          ))}

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
