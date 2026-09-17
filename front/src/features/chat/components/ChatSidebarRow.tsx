import Avatar from '../../../components/Avatar'
import type { Conversation } from '../types'

// ChatSidebarRow – dumb conversation row for ChatSidebar: avatar + presence
// dot + names + online/active indicators. No hooks here.
export default function ChatSidebarRow({
  conversation,
  active,
  onSelect,
  isOnline,
}: {
  conversation: Conversation
  active: boolean
  onSelect: (id: string) => void
  isOnline?: (id: string) => boolean
}) {
  return (
    <li>
      <button
        onClick={() => onSelect(conversation.id)}
        className={`flex w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-gray-50 dark:hover:bg-zinc-800 ${active ? 'bg-violet-50 dark:bg-zinc-800' : ''}`}
      >
        <div className="relative">
          <Avatar username={conversation.username} avatarUrl={conversation.avatarUrl} size="md" />
          {isOnline && (
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-zinc-900 ${isOnline(conversation.id) ? 'bg-green-500' : 'bg-gray-300 dark:bg-zinc-600'}`}
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{conversation.username}</p>
          <p className="truncate text-xs text-gray-500 dark:text-zinc-400">{conversation.lastMessage}</p>
        </div>
        <span className={`h-2 w-2 shrink-0 rounded-full ${isOnline?.(conversation.id) ? 'bg-green-500' : 'bg-transparent'}`} />
        {active && <span className="h-2 w-2 rounded-full bg-violet-500" />}
      </button>
    </li>
  )
}
