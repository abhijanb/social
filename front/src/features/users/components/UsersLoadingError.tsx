// UsersLoadingError – dumb loading / error states for /users. No hooks here.
export function UsersLoading() {
  return <div className="p-6 text-center text-gray-500 dark:text-zinc-400">Loading users...</div>
}

export function UsersError() {
  return <div className="p-6 text-center text-red-600">Failed to load users</div>
}
