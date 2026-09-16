// LivestreamJoin – dumb join panel for a live room: camera / watch buttons
// + blocked note + join error. No hooks here.
export default function LivestreamJoin({
  joining,
  cameraBlocked,
  joinError,
  onJoinCamera,
  onJoinWatch,
}: {
  joining: boolean
  cameraBlocked: boolean
  joinError: string | null
  onJoinCamera: () => void
  onJoinWatch: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <div className="flex gap-2">
        <button
          onClick={onJoinCamera}
          disabled={joining}
          className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-40"
        >
          {joining ? 'Joining...' : 'Join with camera'}
        </button>
        <button
          onClick={onJoinWatch}
          disabled={joining}
          className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-40 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Watch without camera
        </button>
      </div>
      {cameraBlocked && (
        <p className="text-xs text-gray-500 dark:text-zinc-400">
          Camera unavailable or blocked — you can still watch and comment
        </p>
      )}
      {joinError && <p className="text-xs text-red-600 dark:text-red-400">{joinError}</p>}
    </div>
  )
}
