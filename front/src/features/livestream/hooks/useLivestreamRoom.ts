import { useEffect, useRef, useState } from 'react'
import { MAX_LIVESTREAM_COMMENT } from '../components/LivestreamComposer'
import { useLivestreamComments } from './useLivestreamComments'
import { useLivestreamVideo } from './useLivestreamVideo'

// useLivestreamRoom – orchestration for one live room, no JSX: comments
// polling + video state + draft + auto-scroll + leave cleanup + send.
export function useLivestreamRoom(streamId: string) {
  const { comments, isLoading, streamEnded, isSending, handleSend } = useLivestreamComments(streamId, true)
  const video = useLivestreamVideo()
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement | null>(null)

  // Tear down WebRTC when leaving the room (peers are notified via the
  // socket disconnect). Cleanup only — no state writes.
  useEffect(() => {
    return () => {
      video.leave()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamId])

  // Auto-scroll to newest comments (external DOM sync, no state writes).
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [comments.length])

  const trimmed = draft.trim()
  const canSend = !!trimmed && trimmed.length <= MAX_LIVESTREAM_COMMENT && !isSending && !streamEnded

  const submit = async () => {
    if (!canSend) return
    try {
      await handleSend(trimmed)
      setDraft('')
    } catch {
      // errors surface via the room error line below
    }
  }

  return {
    comments,
    commentsLoading: isLoading,
    streamEnded,
    isSending,
    video,
    draft,
    setDraft,
    bottomRef,
    canSend,
    submit,
  }
}
