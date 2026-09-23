import type { Conversation } from '../types'
import ChatSidebar from './ChatSidebar'
import { isUnauthorizedError } from '../../../app/apiError'

// ChatSidebarPanel – dumb desktop sidebar states for /chat:
// loading / error / empty / list. Data + callbacks come from the page.
export default function ChatSidebarPanel({
  conversations,
  isLoadingFriends,
  friendsError,
  activeId,
  onSelect,
  filter,
  onFilterChange,
  isOnline,
}: {
  conversations: Conversation[]
  isLoadingFriends: boolean
  friendsError?: unknown
  activeId: string | null
  onSelect: (id: string) => void
  filter: string
  onFilterChange: (v: string) => void
  isOnline: (id: string) => boolean
}) {
  if (isLoadingFriends && !conversations.length) {
    return (
      <div className="flex h-full items-center justify-center border-r border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-sm text-gray-500 dark:text-zinc-400">Loading chats...</p>
      </div>
    )
  }
  if (conversations.length === 0) {
    return (
      <div className="flex h-full flex-col border-r border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex h-full items-center justify-center p-6 text-center">
          {friendsError && !isUnauthorizedError(friendsError) ? (
            <p className="text-sm text-red-600 dark:text-red-400">Couldn&apos;t load chats.</p>
          ) : (
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">No friends yet</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">Add friends from search to start chatting</p>
            </div>
          )}
        </div>
      </div>
    )
  }
  return (
    <ChatSidebar
      conversations={conversations}
      activeId={activeId}
      onSelect={onSelect}
      filter={filter}
      onFilterChange={onFilterChange}
      isOnline={isOnline}
    />
  )
}
