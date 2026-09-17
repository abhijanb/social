import { useFriendRequests } from '../features/friendship/hooks/useFriendRequests'
import FriendRequestList from '../features/friendship/components/FriendRequestList'

// FriendRequestsPage – thin shell for /requests: loading state + sent/received lists.
// Auth is gated by ProtectedLayout; stale sessions log out via useFriendRequests.
export default function FriendRequestsPage() {
  const {
    isResolvingUser,
    sent,
    received,
    isLoading,
    error,
    isAccepting,
    isRemoving,
    accept,
    cancel,
    decline,
  } = useFriendRequests()

  if (isResolvingUser && isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 px-4 py-8 dark:bg-[#16171d]">
        <div className="mx-auto max-w-3xl text-center text-sm text-gray-500 dark:text-zinc-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 px-4 py-8 dark:bg-[#16171d]">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Friend Requests</h1>

        <FriendRequestList
          title="Received"
          items={received}
          type="received"
          isLoading={isLoading}
          error={error}
          isAccepting={isAccepting}
          isRemoving={isRemoving}
          onAccept={accept}
          onDecline={decline}
          emptyMessage="No received requests"
        />

        <FriendRequestList
          title="Sent"
          items={sent}
          type="sent"
          isLoading={isLoading}
          error={error}
          isRemoving={isRemoving}
          onCancel={cancel}
          emptyMessage="No sent requests"
        />
      </div>
    </div>
  )
}
