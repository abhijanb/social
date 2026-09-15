import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../features/auth/hooks/useAuth'
import { useGetMeQuery } from '../features/users/usersApi'
import { useGetLiveStreamsQuery } from '../features/livestream/livestreamApi'
import LivestreamList from '../features/livestream/components/LivestreamList'
import StartLivestream from '../features/livestream/components/StartLivestream'
import LivestreamRoom from '../features/livestream/components/LivestreamRoom'

function isUnauthorizedError(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 401
}

// LivestreamPage – friends-only live rooms: go live on top, live list
// beside the active room. Comments poll every 1.5s (auth required).
export default function LivestreamPage() {
  const { isAuthenticated } = useAuth()
  const [activeId, setActiveId] = useState<string | null>(null)

  const { data: me, error: meError } = useGetMeQuery(undefined, { skip: !isAuthenticated })
  const {
    data: streams = [],
    isLoading,
    error: streamsError,
  } = useGetLiveStreamsQuery(undefined, {
    skip: !isAuthenticated,
    // Keep the live list fresh (new/ended streams) without manual refresh.
    pollingInterval: 15000,
    skipPollingIfUnfocused: true,
  })

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (isUnauthorizedError(meError) || isUnauthorizedError(streamsError)) return <Navigate to="/login" replace />

  const myStream = streams.find((s) => s.hostId === me?.id) ?? null
  const activeStream = streams.find((s) => s.id === activeId) ?? null

  const handleSelect = (id: string) => {
    setActiveId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 px-4 py-8 dark:bg-[#16171d]">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Live</h1>
        <StartLivestream myStream={myStream} onStarted={setActiveId} />

        <div className="mt-4 flex flex-col gap-4 sm:flex-row">
          <div className="shrink-0 sm:w-80">
            <div className="sm:hidden mb-2">
              <select
                value={activeId ?? ''}
                onChange={(e) => setActiveId(e.target.value || null)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              >
                <option value="">Select a live stream</option>
                {streams.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} — {s.host.username}
                  </option>
                ))}
              </select>
            </div>
            <div className="hidden sm:block">
              <LivestreamList
                streams={streams}
                currentUserId={me?.id ?? null}
                activeId={activeId}
                onSelect={handleSelect}
                isLoading={isLoading}
              />
            </div>
          </div>

          <div className="flex min-h-[50vh] min-w-0 flex-1 flex-col">
            {activeStream ? (
              <LivestreamRoom key={activeStream.id} stream={activeStream} />
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-gray-300 p-6 text-center dark:border-zinc-600">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {streams.length === 0 ? 'No live streams' : 'Pick a stream to watch'}
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
                    Comments appear live, refreshing every 1.5 seconds
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
