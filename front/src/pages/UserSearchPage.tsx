import { Navigate } from 'react-router-dom'
import { useUserSearch } from '../features/search/hooks/useUserSearch'
import SearchBar from '../features/search/components/SearchBar'

export default function UserSearchPage() {
  const { isAuthenticated, query, setQuery, debouncedTrimmed, users, isLoading, error } = useUserSearch()
  if (!isAuthenticated) return <Navigate to="/login" replace />

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 px-4 py-8 dark:bg-[#16171d]">
      <div className="mx-auto max-w-3xl">
        <SearchBar value={query} onChange={setQuery} />

        {debouncedTrimmed && isLoading && (
          <p className="mt-6 text-center text-sm text-gray-500 dark:text-zinc-400">Searching...</p>
        )}

        {debouncedTrimmed && error && (
          <p className="mt-6 text-center text-sm text-red-600 dark:text-red-400">Failed to load users</p>
        )}

        {debouncedTrimmed && !isLoading && !error && users && (
          <>
            {users.length === 0 ? (
              <p className="mt-6 text-center text-sm text-gray-500 dark:text-zinc-400">
                No users found{debouncedTrimmed ? ` for "${debouncedTrimmed}"` : ''}
              </p>
            ) : (
              <ul className="mt-6 space-y-2">
                {users.map((u) => (
                  <li
                    key={u.id}
                    className="rounded-lg border border-gray-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    <p className="font-medium text-gray-900 dark:text-white">{u.username}</p>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  )
}
