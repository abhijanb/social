function btn(active: boolean): string {
  return `rounded-lg px-3 py-1.5 text-xs font-medium text-white transition ${
    active ? 'bg-zinc-600 hover:bg-zinc-500' : 'bg-red-600 hover:bg-red-700'
  }`
}

// LivestreamControls – dumb camera/mic/leave buttons for the video grid. No hooks here.
export default function LivestreamControls({
  cameraOn,
  micOn,
  onToggleCamera,
  onToggleMic,
  onLeave,
}: {
  cameraOn: boolean
  micOn: boolean
  onToggleCamera: () => void
  onToggleMic: () => void
  onLeave: () => void
}) {
  return (
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
  )
}
