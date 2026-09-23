// LivestreamEmptyState – dumb placeholder for /live when no room is selected.
// Dumb: hasStreams flag + optional query error (which replaces the
// "No live streams" empty text so failures don't look empty; 401 falls
// through to empty since the page hook logs out on it).
import { isUnauthorizedError } from '../../../app/apiError'

export default function LivestreamEmptyState({ hasStreams, error }: { hasStreams: boolean; error?: unknown }) {
  const showError = !!error && !isUnauthorizedError(error)
  return (
    <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-gray-300 p-6 text-center dark:border-zinc-600">
      <div>
        {showError ? (
          <p className="text-sm font-medium text-red-600 dark:text-red-400">Couldn&apos;t load live streams.</p>
        ) : (
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {hasStreams ? 'Pick a stream to watch' : 'No live streams'}
          </p>
        )}
        <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">Comments appear live, refreshing every 1.5 seconds</p>
      </div>
    </div>
  )
}
