import type { Livestream } from '../livestreamApi'
import { useLivestreamRoom } from '../hooks/useLivestreamRoom'
import LivestreamComments from './LivestreamComments'
import LivestreamComposer from './LivestreamComposer'
import LivestreamHeader from './LivestreamHeader'
import LivestreamJoin from './LivestreamJoin'
import LivestreamVideoGrid from './LivestreamVideoGrid'

// LivestreamRoom – thin shell for one stream: header, video section,
// comments + composer. Orchestration lives in useLivestreamRoom.
// Keyed by stream id by the parent.
export default function LivestreamRoom({ stream, username }: { stream: Livestream; username: string }) {
  const {
    comments,
    commentsLoading,
    streamEnded,
    isSending,
    video,
    draft,
    setDraft,
    bottomRef,
    canSend,
    submit,
  } = useLivestreamRoom(stream.id)

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-gray-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <LivestreamHeader title={stream.title} hostname={stream.host.username} />

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
          <LivestreamJoin
            joining={video.joining}
            cameraBlocked={video.cameraBlocked}
            joinError={video.joinError}
            onJoinCamera={() => void video.join(stream.id, 'camera')}
            onJoinWatch={() => void video.join(stream.id, 'watch')}
          />
        )}
      </div>

      <LivestreamComments comments={comments} isLoading={commentsLoading} bottomRef={bottomRef} />

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
