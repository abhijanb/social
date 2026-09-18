import UsersList from '../features/users/components/UsersList'
import { UsersError, UsersLoading } from '../features/users/components/UsersLoadingError'
import { useUsersPage } from '../features/users/hooks/useUsersPage'

// UsersPage – thin shell for /users: states + list shell.
// Data + delete live in useUsersPage, JSX in users/components.
export default function UsersPage() {
  const { users, isLoading, error, currentUserId, handleDelete } = useUsersPage()

  if (isLoading) return <UsersLoading />
  if (error) return <UsersError />

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
      <UsersList users={users} currentUserId={currentUserId} onDelete={handleDelete} />
    </div>
  )
}
