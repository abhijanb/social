import { Link } from 'react-router-dom'
import Avatar from '../../../components/Avatar'
import type { User } from '../usersApi'

// UsersList – dumb list for /users: empty / rows with profile links +
// self-only delete (other rows have no button; the backend 403s anyway).
// Data + callbacks come from useUsersPage; no hooks here.
export default function UsersList({
  users,
  currentUserId,
  onDelete,
}: {
  users: User[] | undefined
  currentUserId: string | undefined
  onDelete: (id: string) => void
}) {
  if (!users?.length) {
    return <p className="text-gray-500 dark:text-zinc-400">No users found.</p>
  }
  return (
    <ul className="space-y-2">
      {users.map((u) => (
        <li
          key={u.id}
          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800"
        >
          <div className="flex min-w-0 items-center gap-3">
            <Avatar username={u.username} avatarUrl={u.avatarUrl} size="sm" />
            <div className="min-w-0">
              <Link
                to={`/u/${encodeURIComponent(u.username)}`}
                className="block truncate font-medium text-gray-900 hover:underline dark:text-white"
              >
                {u.username}
              </Link>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                {u.id} • {new Date(u.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          {u.id === currentUserId && (
            <button
              onClick={() => onDelete(u.id)}
              className="rounded-md bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
            >
              Delete
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}
