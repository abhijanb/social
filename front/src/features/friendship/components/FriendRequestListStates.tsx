// FriendRequestListStates – dumb loading / error / empty states for
// FriendRequestList. Discriminated props make impossible states unrenderable.
export default function FriendRequestListStates(
  props:
    | { status: 'loading' }
    | { status: 'error' }
    | { status: 'empty'; emptyMessage?: string; type: 'sent' | 'received' },
) {
  if (props.status === 'loading') {
    return <p className="py-4 text-center text-sm text-gray-500 dark:text-zinc-400">Loading...</p>
  }
  if (props.status === 'error') {
    return <p className="py-4 text-center text-sm text-red-600 dark:text-red-400">Failed to load requests</p>
  }
  return (
    <p className="py-4 text-center text-sm text-gray-500 dark:text-zinc-400">
      {props.emptyMessage ?? `No ${props.type} requests`}
    </p>
  )
}
