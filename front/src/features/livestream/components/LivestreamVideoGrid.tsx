import type { PeerTile } from '../hooks/useLivestreamVideo'
import { getGridCols } from '../layout'
import LivestreamControls from './LivestreamControls'
import LivestreamVideoAvatar from './LivestreamVideoAvatar'
import LivestreamVideoTile from './LivestreamVideoTile'

type Props = {
  localStream: MediaStream | null
  localName: string
  cameraOn: boolean
  micOn: boolean
  peers: PeerTile[]
  onToggleCamera: () => void
  onToggleMic: () => void
  onLeave: () => void
}

// LivestreamVideoGrid – thin shell: local preview + remote tiles with avatar
// fallback when a camera is off, mic badges, and media controls.
// Tile/avatar/controls/layout live in sibling modules.
export default function LivestreamVideoGrid({
  localStream,
  localName,
  cameraOn,
  micOn,
  peers,
  onToggleCamera,
  onToggleMic,
  onLeave,
}: Props) {
  const showLocalVideo = !!localStream && cameraOn
  const cols = getGridCols(1 + peers.length)

  return (
    <div className="rounded-xl border border-gray-200 bg-black p-2 dark:border-zinc-700">
      <div className={`grid gap-2 ${cols}`}>
        <div className="relative aspect-video overflow-hidden rounded-lg bg-zinc-900">
          {showLocalVideo && localStream ? (
            <LivestreamVideoTile stream={localStream} muted label="Your camera" />
          ) : (
            <LivestreamVideoAvatar name={localName} />
          )}
          <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[11px] font-medium text-white">
            You {!micOn && '· muted'}
          </span>
        </div>
        {peers.map((peer) => (
          <div key={peer.socketId} className="relative aspect-video overflow-hidden rounded-lg bg-zinc-900">
            {peer.stream && peer.video ? (
              <LivestreamVideoTile stream={peer.stream} muted={false} label={`Video from ${peer.username}`} />
            ) : (
              <LivestreamVideoAvatar name={peer.username} />
            )}
            <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[11px] font-medium text-white">
              {peer.username} {!peer.audio && '· muted'}
            </span>
          </div>
        ))}
      </div>
      <LivestreamControls
        cameraOn={cameraOn}
        micOn={micOn}
        onToggleCamera={onToggleCamera}
        onToggleMic={onToggleMic}
        onLeave={onLeave}
      />
    </div>
  )
}
