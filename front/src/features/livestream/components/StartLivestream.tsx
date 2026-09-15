import { useState } from 'react'
import { useEndStreamMutation, useStartStreamMutation, type Livestream } from '../livestreamApi'

const MAX_TITLE = 100

// StartLivestream – go live with a title, or end your current stream.
// Shows the host's live state when they already have one.
export default function StartLivestream({
  myStream,
  onStarted,
}: {
  myStream: Livestream | null
  onStarted?: (id: string) => void
}) {
  const [title, setTitle] = useState('')
  const [startStream, { isLoading: isStarting, error: startError }] = useStartStreamMutation()
  const [endStream, { isLoading: isEnding }] = useEndStreamMutation()

  const trimmed = title.trim()
  const canStart = !!trimmed && !isStarting

  const handleStart = async () => {
    if (!canStart) return
    try {
      const stream = await startStream({ title: trimmed }).unwrap()
      setTitle('')
      onStarted?.(stream.id)
    } catch {
      // error surfaces via `startError` below
    }
  }

  if (myStream) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30">
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900 dark:text-white">
          <span className="mr-2 rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">LIVE</span>
          {myStream.title}
        </p>
        <button
          onClick={() => endStream({ id: myStream.id })}
          disabled={isEnding}
          className="shrink-0 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-40 dark:bg-zinc-700 dark:hover:bg-zinc-600"
        >
          {isEnding ? 'Ending...' : 'End'}
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Stream title..."
          maxLength={MAX_TITLE}
          className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
        />
        <button
          onClick={handleStart}
          disabled={!canStart}
          className="shrink-0 rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isStarting ? 'Going live...' : 'Go Live'}
        </button>
      </div>
      {startError && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {'status' in startError && typeof startError.data === 'object' && startError.data !== null && 'message' in startError.data
            ? String((startError.data as { message: unknown }).message)
            : 'Failed to go live'}
        </p>
      )}
    </div>
  )
}
