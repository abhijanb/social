import type { FriendshipPending } from '../friendshipApi'
import FriendRequestItem from './FriendRequestItem'
import FriendRequestListStates from './FriendRequestListStates'

type Props = {
  title: string
  items: FriendshipPending[]
  type: 'sent' | 'received'
  isLoading?: boolean
  error?: unknown
  isAccepting?: boolean
  isRemoving?: boolean
  onAccept?: (id: string) => void
  onCancel?: (id: string) => void
  onDecline?: (id: string) => void
  emptyMessage?: string
}

// FriendRequestList – thin shell: titled card + status screens + rows.
// States live in FriendRequestListStates, rows in FriendRequestItem.
export default function FriendRequestList({
  title,
  items,
  type,
  isLoading,
  error,
  isAccepting,
  isRemoving,
  onAccept,
  onCancel,
  onDecline,
  emptyMessage,
}: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
      <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
        {title} <span className="font-normal text-gray-500 dark:text-zinc-400">({items.length})</span>
      </h2>

      {isLoading ? (
        <FriendRequestListStates status="loading" />
      ) : error ? (
        <FriendRequestListStates status="error" />
      ) : items.length === 0 ? (
        <FriendRequestListStates status="empty" emptyMessage={emptyMessage} type={type} />
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <FriendRequestItem
              key={item.id}
              item={item}
              type={type}
              onAccept={onAccept}
              onCancel={onCancel}
              onDecline={onDecline}
              isAccepting={isAccepting}
              isRemoving={isRemoving}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
