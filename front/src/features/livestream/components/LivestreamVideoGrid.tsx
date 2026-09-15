import { useEffect, useRef } from 'react'
import type { PeerTile } from '../hooks/useLivestreamVideo'

function initials(name: string): string {
  return name.charAt(0).toUpperCase() || '?'
}

// VideoTile – binds a MediaStream to a <video> element (external DOM sync).
function VideoTile({
  stream,
  muted,
  label,
}: {
  stream: MediaStream
  muted: boolean
  label: string
}) {
  const ref = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (el && el.srcObject !== stream) el.srcObject = stream
  }, [stream])

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted={muted}
      aria-label={label}
      className="h-full w-full object-cover"
    />
  )
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-500 to-[#aa3bff]">
      <span className="text-2xl font-semibold text-white">{initials(name)}</span>
    </div>
  )
}

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

// LivestreamVideoGrid – local preview + remote tiles with avatar fallback
// when a camera is off, mic state icons, and media controls.
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
  const tiles = 1 + peers.length
  const cols = tiles <= 1 ? 'grid-cols-1' : tiles === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'

  const btn = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-xs font-medium text-white transition ${
      active ? 'bg-zinc-600 hover:bg-zinc-500' : 'bg-red-600 hover:bg-red-700'
    }`

  return (
    <div className="rounded-xl border border-gray-200 bg-black p-2 dark:border-zinc-700">
      <div className={`grid gap-2 ${cols}`}>
        <div className="relative aspect-video overflow-hidden rounded-lg bg-zinc-900">
          {showLocalVideo && localStream ? (
            <VideoTile stream={localStream} muted label="Your camera" />
          ) : (
            <Avatar name={localName} />
          )}
          <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[11px] font-medium text-white">
            You {!micOn && '· muted'}
          </span>
        </div>
        {peers.map((peer) => (
          <div key={peer.socketId} className="relative aspect-video overflow-hidden rounded-lg bg-zinc-900">
            {peer.stream && peer.video ? (
              <VideoTile stream={peer.stream} muted={false} label={`Video from ${peer.username}`} />
            ) : (
              <Avatar name={peer.username} />
            )}
            <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[11px] font-medium text-white">
              {peer.username} {!peer.audio && '· muted'}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2 pt-2">
        <button onClick={onToggleCamera} className={btn(cameraOn)} aria-label="Toggle camera">
          {cameraOn ? 'Camera off' : 'Camera on'}
        </button>
        <button onClick={onToggleMic} className={btn(micOn)} aria-label="Toggle microphone">
          {micOn ? 'Mute' : 'Unmute'}
        </button>
        <button
          onClick={onLeave}
          className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-700"
        >
          Leave video
        </button>
      </div>
    </div>
  )
}
