import Avatar from '../../../components/Avatar'
import { isUnauthorizedError } from '../../../app/apiError'
import type { Livestream } from '../livestreamApi'

type Props = {
  streams: Livestream[]
  currentUserId: string | null
  activeId: string | null
  onSelect: (id: string) => void
  isLoading: boolean
  error?: unknown
}

// LivestreamList – live streams from self + friends with LIVE badge.
// The host's own stream is marked "You". A (non-401) query failure renders
// an error instead of the "No one is live" empty state; 401 logs out via
// the page hook, so it falls through to empty during redirect.
export default function LivestreamList({ streams, currentUserId, activeId, onSelect, isLoading, error }: Props) {
  if (isLoading && streams.length === 0) {
    return <p className="py-6 text-center text-sm text-gray-500 dark:text-zinc-400">Loading live streams...</p>
  }

  if (error && !isUnauthorizedError(error)) {
    return <p className="py-6 text-center text-sm text-red-600 dark:text-red-400">Couldn&apos;t load live streams.</p>
  }

  if (streams.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-sm font-medium text-gray-900 dark:text-white">No one is live</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
          Go live yourself, or add friends to watch theirs
        </p>
      </div>
    )
  }

  return (
    <ul className="space-y-2">
      {streams.map((stream) => {
        const isMine = stream.hostId === currentUserId
        const isActive = stream.id === activeId
        return (
          <li key={stream.id}>
            <button
              onClick={() => onSelect(stream.id)}
              className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                isActive
                  ? 'border-[#aa3bff] bg-violet-50 dark:border-violet-500 dark:bg-violet-500/10'
                  : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800'
              }`}
            >
              <div className="shrink-0">
                <Avatar username={stream.host.username} avatarUrl={stream.host.avatarUrl} size="md" className="!h-10 !w-10" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {stream.title}
                  {isMine && <span className="ml-2 text-xs font-normal text-gray-500 dark:text-zinc-400">(You)</span>}
                </p>
                <p className="truncate text-xs text-gray-500 dark:text-zinc-400">{stream.host.username}</p>
              </div>
              <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                LIVE
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
