import type { Conversation } from '../types'
import { useFilteredConversations } from '../hooks/useFilteredConversations'
import ChatSidebarRow from './ChatSidebarRow'
import ChatSidebarSearch from './ChatSidebarSearch'

type Props = {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  filter: string
  onFilterChange: (v: string) => void
  isOnline?: (id: string) => boolean
}

// ChatSidebar – thin shell: search + filtered conversation rows.
// Filter + online-first sort live in useFilteredConversations.
export default function ChatSidebar({ conversations, activeId, onSelect, filter, onFilterChange, isOnline }: Props) {
  const filtered = useFilteredConversations(conversations, filter, isOnline)

  return (
    <div className="flex h-full w-full flex-col border-r border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
      <ChatSidebarSearch filter={filter} onFilterChange={onFilterChange} />
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-500 dark:text-zinc-400">No chats found</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-zinc-800">
            {filtered.map((c) => (
              <ChatSidebarRow key={c.id} conversation={c} active={activeId === c.id} onSelect={onSelect} isOnline={isOnline} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
