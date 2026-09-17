import LivestreamEmptyState from '../features/livestream/components/LivestreamEmptyState'
import LivestreamList from '../features/livestream/components/LivestreamList'
import LivestreamRoom from '../features/livestream/components/LivestreamRoom'
import LivestreamPicker from '../features/livestream/components/LivestreamPicker'
import StartLivestream from '../features/livestream/components/StartLivestream'
import { useLivestreamPage } from '../features/livestream/hooks/useLivestreamPage'

// LivestreamPage – thin shell for /live: go-live bar + list/room.
// Auth is gated by ProtectedLayout; stale sessions log out via useLivestreamPage.
export default function LivestreamPage() {
  const {
    me,
    streams,
    isLoading,
    myStream,
    activeStream,
    activeId,
    setActiveId,
    handleSelect,
  } = useLivestreamPage()

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 px-4 py-8 dark:bg-[#16171d]">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Live</h1>
        <StartLivestream myStream={myStream} onStarted={setActiveId} />

        <div className="mt-4 flex flex-col gap-4 sm:flex-row">
          <div className="shrink-0 sm:w-80">
            <LivestreamPicker streams={streams} activeId={activeId} onChange={setActiveId} />
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
              <LivestreamRoom key={activeStream.id} stream={activeStream} username={me?.username ?? '?'} />
            ) : (
              <LivestreamEmptyState hasStreams={streams.length > 0} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
