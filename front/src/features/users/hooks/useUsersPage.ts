import { useDeleteUserMutation, useGetMeQuery, useGetUsersQuery } from '../usersApi'

// useUsersPage – all data + delete logic for /users, no JSX.
export function useUsersPage() {
  const { data: users, isLoading, error } = useGetUsersQuery()
  const { data: me } = useGetMeQuery()
  const [deleteUser] = useDeleteUserMutation()

  const handleDelete = (id: string) => {
    if (id !== me?.id) return
    if (window.confirm('Delete your account? This cannot be undone.')) {
      void deleteUser(id)
    }
  }

  return { users, isLoading, error, currentUserId: me?.id, handleDelete }
}
