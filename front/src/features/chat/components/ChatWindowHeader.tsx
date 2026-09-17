import Avatar from '../../../components/Avatar'
import type { Conversation } from '../types'

// ChatWindowHeader – dumb presence header for ChatWindow: avatar + name +
// Online / Offline•lastSeen / Offline. No hooks here.
export default function ChatWindowHeader({
  conversation,
  isOnline,
  lastSeen,
}: {
  conversation: Conversation
  isOnline?: boolean
  lastSeen?: string | null
}) {
  return (
    <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
      <Avatar username={conversation.username} avatarUrl={conversation.avatarUrl} size="sm" />
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{conversation.username}</p>
        {isOnline ? (
          <p className="text-xs text-green-600 dark:text-green-400">Online</p>
        ) : lastSeen ? (
          <p className="text-xs text-gray-500 dark:text-zinc-400">Offline • {lastSeen}</p>
        ) : (
          <p className="text-xs text-gray-500 dark:text-zinc-400">Offline</p>
        )}
      </div>
    </div>
  )
}
