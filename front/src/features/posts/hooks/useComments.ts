import { useEffect, useState } from 'react'
import { useAppDispatch } from '../../../app/hooks'
import { logout } from '../../auth/authSlice'
import { useGetMeQuery } from '../../users/usersApi'
import { useCreateCommentMutation, useDeleteCommentMutation, useGetCommentsQuery } from '../postsApi'

export function isUnauthorizedError(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 401
}

export function timeAgo(iso: string): string {
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

// useComments – fetch-on-open comments for one post, no JSX: toggle state,
// list loaded once on expand, composer + delete with instant refetch via
// tag invalidation (no polling). Delete mirrors the count optimistically
// (reverted if the DELETE fails) while the api patch drops/restores rows.
export function useComments({
  postId,
  onCommentAdded,
  onCommentDeleted,
}: {
  postId: string
  onCommentAdded?: (postId: string) => void
  onCommentDeleted?: (postId: string) => void
}) {
  const dispatch = useAppDispatch()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const { data: comments, isLoading, isFetching, error } = useGetCommentsQuery({ postId }, { skip: !open })
  const [createComment, { isLoading: isSending }] = useCreateCommentMutation()
  const [deleteComment] = useDeleteCommentMutation()
  const { data: me } = useGetMeQuery(undefined, { skip: !open })
  const meId = me?.id

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

  const handleDelete = async (commentId: string) => {
    if (deletingIds.has(commentId)) return
    setDeletingIds((prev) => new Set(prev).add(commentId))
    // Optimistic count: list row already drops instantly via the api
    // optimistic patch; mirror it here so the toggle label updates too.
    // Reverted below if the DELETE fails (api patch.undo() restores row).
    onCommentDeleted?.(postId)
    try {
      await deleteComment({ postId, commentId }).unwrap()
    } catch {
      // 403/404 stays silent — revert the optimistic -1.
      onCommentAdded?.(postId)
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev)
        next.delete(commentId)
        return next
      })
    }
  }

  return {
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
  }
}
