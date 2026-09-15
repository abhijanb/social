import { useEffect, useRef, useState } from 'react'
import { useLivestreamComments } from '../hooks/useLivestreamComments'
import type { Livestream } from '../livestreamApi'

const MAX_COMMENT = 500

// LivestreamRoom – watches one stream: live comment list (1.5s polling)
// with auto-scroll plus a composer. Keyed by stream id by the parent.
export default function LivestreamRoom({ stream }: { stream: Livestream }) {
  const { comments, isLoading, streamEnded, isSending, handleSend } = useLivestreamComments(stream.id, true)
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement | null>(null)

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

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {isLoading && comments.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500 dark:text-zinc-400">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500 dark:text-zinc-400">
            No comments yet — say hi!
          </p>
        ) : (
          <ul className="space-y-2">
            {comments.map((c) => (
              <li key={c.id} className="text-sm leading-relaxed">
                <span className="font-medium text-gray-900 dark:text-white">{c.author.username}</span>{' '}
                <span className="break-words text-gray-700 dark:text-zinc-200">{c.text}</span>
              </li>
            ))}
          </ul>
        )}
        <div ref={bottomRef} aria-hidden="true" />
      </div>

      {streamEnded ? (
        <p className="border-t border-gray-200 p-3 text-center text-sm font-medium text-gray-500 dark:border-zinc-700 dark:text-zinc-400">
          Stream ended
        </p>
      ) : (
        <div className="flex gap-2 border-t border-gray-200 p-3 dark:border-zinc-700">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
            }}
            placeholder="Add a comment..."
            maxLength={MAX_COMMENT + 50}
            className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
          />
          <button
            onClick={submit}
            disabled={!canSend}
            className="shrink-0 rounded-lg bg-[#aa3bff] px-4 py-1.5 text-sm font-medium text-white transition hover:bg-[#9835e6] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-violet-600 dark:hover:bg-violet-700"
          >
            {isSending ? '...' : 'Send'}
          </button>
        </div>
      )}
    </div>
  )
}
