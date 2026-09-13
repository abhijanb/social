import { useGetUsersQuery, useDeleteUserMutation } from './usersApi'

export default function UsersPage() {
  const { data: users, isLoading, error } = useGetUsersQuery()
  const [deleteUser] = useDeleteUserMutation()

  if (isLoading) return <div className="p-6 text-center text-gray-500 dark:text-zinc-400">Loading users...</div>
  if (error) return <div className="p-6 text-center text-red-600">Failed to load users</div>

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
      {!users?.length ? (
        <p className="text-gray-500 dark:text-zinc-400">No users found.</p>
      ) : (
        <ul className="space-y-2">
          {users.map((u) => (
            <li key={u.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{u.username}</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400">{u.id} • {new Date(u.createdAt).toLocaleString()}</p>
              </div>
              <button
                onClick={() => deleteUser(u.id)}
                className="rounded-md bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
