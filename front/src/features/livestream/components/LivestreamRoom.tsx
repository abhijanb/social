import { useEffect, useRef, useState } from 'react'
import { useLivestreamComments } from '../hooks/useLivestreamComments'
import { useLivestreamVideo } from '../hooks/useLivestreamVideo'
import type { Livestream } from '../livestreamApi'
import LivestreamComments from './LivestreamComments'
import LivestreamComposer, { MAX_LIVESTREAM_COMMENT } from './LivestreamComposer'
import LivestreamVideoGrid from './LivestreamVideoGrid'

const MAX_COMMENT = MAX_LIVESTREAM_COMMENT

// LivestreamRoom – watches one stream: WebRTC video grid on top, live
// comment list (1.5s polling) with auto-scroll plus a composer below.
// Keyed by stream id by the parent. Video is opt-in per join: camera,
// audio-only, or watch-only all work.
export default function LivestreamRoom({ stream, username }: { stream: Livestream; username: string }) {
  const { comments, isLoading, streamEnded, isSending, handleSend } = useLivestreamComments(stream.id, true)
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
  }, [stream.id])

  // Auto-scroll to newest comments (external DOM sync, no state writes).
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [comments.length])

  const trimmed = draft.trim()
  const canSend = !!trimmed && trimmed.length <= MAX_COMMENT && !isSending && !streamEnded

  const submit = async () => {
    if (!canSend) return
    try {
      await handleSend(trimmed)
      setDraft('')
    } catch {
      // errors surface via the room error line below
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-gray-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-center gap-2 border-b border-gray-200 p-3 dark:border-zinc-700">
        <span className="flex items-center gap-1.5 rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
          LIVE
        </span>
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900 dark:text-white">{stream.title}</p>
        <p className="shrink-0 text-xs text-gray-500 dark:text-zinc-400">{stream.host.username}</p>
      </div>

      <div className="border-b border-gray-200 p-3 dark:border-zinc-700">
        {video.videoEnded || streamEnded ? (
          <p className="py-2 text-center text-sm text-gray-500 dark:text-zinc-400">Video ended</p>
        ) : video.joined ? (
          <LivestreamVideoGrid
            localStream={video.localStream}
            localName={username}
            cameraOn={video.cameraOn}
            micOn={video.micOn}
            peers={video.peers}
            onToggleCamera={() => void video.toggleCamera()}
            onToggleMic={() => void video.toggleMic()}
            onLeave={video.leave}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="flex gap-2">
              <button
                onClick={() => void video.join(stream.id, 'camera')}
                disabled={video.joining}
                className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-40"
              >
                {video.joining ? 'Joining...' : 'Join with camera'}
              </button>
              <button
                onClick={() => void video.join(stream.id, 'watch')}
                disabled={video.joining}
                className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-40 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Watch without camera
              </button>
            </div>
            {video.cameraBlocked && (
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                Camera unavailable or blocked — you can still watch and comment
              </p>
            )}
            {video.joinError && (
              <p className="text-xs text-red-600 dark:text-red-400">{video.joinError}</p>
            )}
          </div>
        )}
      </div>

      <LivestreamComments comments={comments} isLoading={isLoading} bottomRef={bottomRef} />

      {streamEnded ? (
        <p className="border-t border-gray-200 p-3 text-center text-sm font-medium text-gray-500 dark:border-zinc-700 dark:text-zinc-400">
          Stream ended
        </p>
      ) : (
        <LivestreamComposer
          draft={draft}
          onChange={setDraft}
          onSubmit={submit}
          isSending={isSending}
          disabled={!canSend}
        />
      )}
    </div>
  )
}
