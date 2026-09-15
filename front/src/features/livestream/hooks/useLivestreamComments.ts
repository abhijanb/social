import { useState } from 'react'
import {
  COMMENT_POLL_MS,
  useGetCommentDeltaQuery,
  useGetCommentsQuery,
  useSendCommentMutation,
  type LivestreamComment,
} from '../livestreamApi'

function hasStatus(error: unknown, status: number): boolean {
  return !!error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === status
}

function mergeById(prev: LivestreamComment[], next: LivestreamComment[]): LivestreamComment[] {
  if (next.length === 0) return prev
  const ids = new Set(prev.map((c) => c.id))
  const fresh = next.filter((c) => !ids.has(c.id))
  if (fresh.length === 0) return prev
  return [...prev, ...fresh].sort((a, b) => {
    const t = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    return t !== 0 ? t : a.id < b.id ? -1 : 1
  })
}

// useLivestreamComments – live comments for one stream. Loads the latest
// page once, then polls only the delta (?sinceId=) every COMMENT_POLL_MS
// (1.5s, paused when the tab is unfocused). Own sends append instantly.
// A 404 from either query means the stream ended. Parent must key the
// room by stream id so state resets per stream (comments are append-only).
export function useLivestreamComments(streamId: string, enabled: boolean) {
  const [comments, setComments] = useState<LivestreamComment[]>([])
  const [sinceId, setSinceId] = useState<string | null>(null)
  const [sendComment, { isLoading: isSending }] = useSendCommentMutation()

  const initial = useGetCommentsQuery({ streamId }, { skip: !enabled })
  const endedByInitial = hasStatus(initial.error, 404)

  // Polling stops once the stream is known to be ended.
  const delta = useGetCommentDeltaQuery(
    { streamId, sinceId: sinceId ?? '' },
    {
      skip: !enabled || sinceId == null || endedByInitial,
      pollingInterval: COMMENT_POLL_MS,
      skipPollingIfUnfocused: true,
    },
  )
  const streamEnded = endedByInitial || hasStatus(delta.error, 404)

  // Accumulate payloads via guarded render-time adjustment (same pattern
  // as FeedPage chunks) — each payload is applied exactly once, tracked by
  // reference in state rather than refs.
  const [appliedInitial, setAppliedInitial] = useState<LivestreamComment[] | undefined>(undefined)
  if (initial.data && initial.data !== appliedInitial) {
    setAppliedInitial(initial.data)
    setComments(initial.data)
    const last = initial.data[initial.data.length - 1]
    setSinceId(last ? last.id : null)
  }

  const [appliedDelta, setAppliedDelta] = useState<LivestreamComment[] | undefined>(undefined)
  if (delta.data && delta.data !== appliedDelta) {
    setAppliedDelta(delta.data)
    if (delta.data.length > 0) {
      const fresh = delta.data
      setComments((prev) => mergeById(prev, fresh))
      setSinceId(fresh[fresh.length - 1].id)
    }
  }

  const handleSend = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isSending || streamEnded) return
    const created = await sendComment({ streamId, text: trimmed }).unwrap()
    // Instant local echo; the poller dedupes by id on arrival.
    setComments((prev) => mergeById(prev, [created]))
    setSinceId(created.id)
  }

  return {
    comments,
    isLoading: initial.isLoading,
    isPolling: !streamEnded,
    streamEnded,
    isSending,
    error: initial.error && !endedByInitial ? initial.error : undefined,
    handleSend,
  }
}
