import { useDeleteUserMutation, useGetUsersQuery } from '../usersApi'

// useUsersPage – all data + delete logic for /users, no JSX.
export function useUsersPage() {
  const { data: users, isLoading, error } = useGetUsersQuery()
  const [deleteUser] = useDeleteUserMutation()

  const handleDelete = (id: string) => {
    void deleteUser(id)
  }

  return { users, isLoading, error, handleDelete }
}
