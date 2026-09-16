import { Link } from 'react-router-dom'
import Avatar from '../../../components/Avatar'
import type { FriendshipPending } from '../friendshipApi'

type Props = {
  item: FriendshipPending
  type: 'sent' | 'received'
  onAccept?: (id: string) => void
  onCancel?: (id: string) => void
  onDecline?: (id: string) => void
  isAccepting?: boolean
  isRemoving?: boolean
}

export default function FriendRequestItem({ item, type, onAccept, onCancel, onDecline, isAccepting, isRemoving }: Props) {
  const otherUser = type === 'received' ? item.requester : item.addressee

  return (
    <li className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar username={otherUser.username} avatarUrl={otherUser.avatarUrl} size="sm" />
        <div className="min-w-0">
          <Link
            to={`/u/${encodeURIComponent(otherUser.username)}`}
            className="block truncate font-medium text-gray-900 hover:underline dark:text-white"
          >
            {otherUser.username}
          </Link>
          <p className="text-xs text-gray-500 dark:text-zinc-400">
            {new Date(item.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {type === 'received' ? (
          <>
            <button
              onClick={() => onAccept?.(item.id)}
              disabled={isAccepting || isRemoving}
              className="rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
            >
              Accept
            </button>
            <button
              onClick={() => onDecline?.(item.id)}
              disabled={isAccepting || isRemoving}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
            >
              Decline
            </button>
          </>
        ) : (
          <button
            onClick={() => onCancel?.(item.id)}
            disabled={isRemoving}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
          >
            Cancel
          </button>
        )}
      </div>
    </li>
  )
}
