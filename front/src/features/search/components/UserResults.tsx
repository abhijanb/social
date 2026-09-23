import { Link } from 'react-router-dom'
import Avatar from '../../../components/Avatar'
import ActionErrorBanner from '../../../components/ActionErrorBanner'
import { isUnauthorizedError } from '../../../app/apiError'
import { friendshipActionErrorMessage } from '../../friendship/components/friendshipActionError'
import type { FriendshipPending } from '../../friendship/friendshipApi'
import type { User } from '../../users/usersApi'

// UserResults – dumb list for the People tab: loading / error / empty / rows
// with friendship actions. All data + callbacks come from the page.
// `actionError` is a friendship mutation error (accept/cancel/decline/send),
// shown as a banner above the rows; `error` is the search-query error.
export default function UserResults({
  query,
  users,
  isLoading,
  error,
  actionError,
  currentUserId,
  pending,
  isRemoving,
  isAccepting,
  isSending,
  onAccept,
  onCancel,
  onDecline,
  onSend,
}: {
  query: string
  users: User[] | undefined
  isLoading: boolean
  error: unknown
  actionError?: unknown
  currentUserId: string | undefined
  pending: FriendshipPending[] | undefined
  isRemoving: boolean
  isAccepting: boolean
  isSending: boolean
  onAccept: (id: string) => void
  onCancel: (id: string) => void
  onDecline: (id: string) => void
  onSend: (addresseeId: string) => void
}) {
  if (!query) return null
  if (isLoading) {
    return <p className="mt-6 text-center text-sm text-gray-500 dark:text-zinc-400">Searching...</p>
  }
  if (error) {
    return (
      <>
        {isUnauthorizedError(error) ? (
          <div className="mt-6 text-center">
            <p className="text-sm text-amber-600 dark:text-amber-400">Session expired, please login again</p>
            <a href="/login" className="mt-2 inline-block text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400">
              Go to login
            </a>
          </div>
        ) : (
          <p className="mt-6 text-center text-sm text-red-600 dark:text-red-400">Failed to load users</p>
        )}
      </>
    )
  }
  if (!users) return null
  if (users.length === 0) {
    return (
      <p className="mt-6 text-center text-sm text-gray-500 dark:text-zinc-400">
        No users found{query ? ` for "${query}"` : ''}
      </p>
    )
  }
  return (
    <>
      <ActionErrorBanner
        error={actionError}
        getMessage={friendshipActionErrorMessage}
        className="mt-6 text-center text-sm text-red-600 dark:text-red-400"
      />
    <ul className="mt-6 space-y-2">
      {users.map((u) => {
        const sent = pending?.find((p) => p.requesterId === currentUserId && p.addresseeId === u.id)
        const received = pending?.find((p) => p.requesterId === u.id && p.addresseeId === currentUserId)
        return (
          <li
            key={u.id}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800"
          >
            <div className="flex min-w-0 items-center gap-3">
              <Avatar username={u.username} avatarUrl={u.avatarUrl} size="sm" />
              <Link
                to={`/u/${encodeURIComponent(u.username)}`}
                className="truncate font-medium text-gray-900 hover:underline dark:text-white"
              >
                {u.username}
              </Link>
            </div>
            <div className="flex items-center gap-2">
              {sent ? (
                <>
                  <span className="rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-600 dark:bg-zinc-700 dark:text-zinc-300">
                    Pending
                  </span>
                  <button
                    onClick={() => onCancel(sent.id)}
                    disabled={isRemoving}
                    className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    Cancel
                  </button>
                </>
              ) : received ? (
                <>
                  <button
                    onClick={() => onAccept(received.id)}
                    disabled={isAccepting || isRemoving}
                    className="rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => onDecline(received.id)}
                    disabled={isAccepting || isRemoving}
                    className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    Decline
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onSend(u.id)}
                  disabled={!currentUserId || isSending}
                  className="rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                >
                  Send Request
                </button>
              )}
            </div>
          </li>
        )
      })}
    </ul>
    </>
  )
}
