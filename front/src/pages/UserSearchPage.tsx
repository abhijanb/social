import { Navigate } from 'react-router-dom'
import { useUserSearch } from '../features/search/hooks/useUserSearch'
import SearchBar from '../features/search/components/SearchBar'
import { useFriendRequests } from '../features/friendship/hooks/useFriendRequests'
import { useSendRequestMutation } from '../features/friendship/friendshipApi'

function isUnauthorizedError(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 401
}

export default function UserSearchPage() {
  const { isAuthenticated, query, setQuery, debouncedTrimmed, users, isLoading, error, isSessionExpired } = useUserSearch()
  const { currentUserId, pending, accept, cancel, decline, isRemoving, isAccepting } = useFriendRequests()
  const [sendRequest, { isLoading: isSending }] = useSendRequestMutation()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (isSessionExpired) return <Navigate to="/login" replace />

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 px-4 py-8 dark:bg-[#16171d]">
      <div className="mx-auto max-w-3xl">
        <SearchBar value={query} onChange={setQuery} />

        {debouncedTrimmed && isLoading && (
          <p className="mt-6 text-center text-sm text-gray-500 dark:text-zinc-400">Searching...</p>
        )}

        {debouncedTrimmed && error && (
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
        )}

        {debouncedTrimmed && !isLoading && !error && users && (
          <>
            {users.length === 0 ? (
              <p className="mt-6 text-center text-sm text-gray-500 dark:text-zinc-400">
                No users found{debouncedTrimmed ? ` for "${debouncedTrimmed}"` : ''}
              </p>
            ) : (
              <ul className="mt-6 space-y-2">
                {users.map((u) => {
                  const sent = pending?.find((p) => p.requesterId === currentUserId && p.addresseeId === u.id)
                  const received = pending?.find((p) => p.requesterId === u.id && p.addresseeId === currentUserId)
                  return (
                    <li
                      key={u.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800"
                    >
                      <p className="font-medium text-gray-900 dark:text-white">{u.username}</p>
                      <div className="flex items-center gap-2">
                        {sent ? (
                          <>
                            <span className="rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-600 dark:bg-zinc-700 dark:text-zinc-300">
                              Pending
                            </span>
                            <button
                              onClick={() => cancel(sent.id)}
                              disabled={isRemoving}
                              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
                            >
                              Cancel
                            </button>
                          </>
                        ) : received ? (
                          <>
                            <button
                              onClick={() => accept(received.id)}
                              disabled={isAccepting || isRemoving}
                              className="rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => decline(received.id)}
                              disabled={isAccepting || isRemoving}
                              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
                            >
                              Decline
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => currentUserId && sendRequest({ requesterId: currentUserId, addresseeId: u.id })}
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
            )}
          </>
        )}
      </div>
    </div>
  )
}
