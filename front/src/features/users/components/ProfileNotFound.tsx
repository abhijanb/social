import { Link } from 'react-router-dom'
import { isNotFoundError } from '../../../app/apiError'

// ProfileNotFound – dumb not-found / error state for the /u/:username header. No hooks here.
export default function ProfileNotFound({ username, error }: { username: string; error: unknown }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
      {isNotFoundError(error) ? (
        <>
          <p className="text-lg font-bold text-gray-900 dark:text-white">User not found</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">No account named “{username}”.</p>
          <Link
            to="/search"
            className="mt-4 inline-block rounded-full bg-violet-600 px-5 py-1.5 text-sm font-semibold text-white hover:bg-violet-700"
          >
            Search users
          </Link>
        </>
      ) : (
        <p className="text-sm text-red-600 dark:text-red-400">Failed to load profile</p>
      )}
    </div>
  )
}
