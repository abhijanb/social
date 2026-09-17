// LivestreamEmptyState – dumb placeholder for /live when no room is selected.
// Dumb: hasStreams flag only.
export default function LivestreamEmptyState({ hasStreams }: { hasStreams: boolean }) {
  return (
    <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-gray-300 p-6 text-center dark:border-zinc-600">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {hasStreams ? 'Pick a stream to watch' : 'No live streams'}
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">Comments appear live, refreshing every 1.5 seconds</p>
      </div>
    </div>
  )
}
