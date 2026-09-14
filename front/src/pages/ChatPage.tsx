import { Navigate } from 'react-router-dom'
import { useAuth } from '../features/auth/hooks/useAuth'
import ChatSidebar from '../features/chat/components/ChatSidebar'
import ChatWindow from '../features/chat/components/ChatWindow'
import { useChatConversations } from '../features/chat/hooks/useChatConversations'
import { useActiveChat } from '../features/chat/hooks/useActiveChat'

function isUnauthorizedError(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 401
}

export default function ChatPage() {
  const { isAuthenticated } = useAuth()
  const {
    currentUserId,
    conversations,
    activeId,
    setActiveId,
    filter,
    setFilter,
    isOnline,
    lastSeen,
    isLoadingFriends,
    meError,
    friendsError,
  } = useChatConversations(isAuthenticated)
  const { uiMessages, isLoadingChat, handleSend } = useActiveChat(activeId, currentUserId)

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (isUnauthorizedError(meError) || isUnauthorizedError(friendsError)) return <Navigate to="/login" replace />

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null
  const isLoading = (isLoadingFriends && !conversations.length) || isLoadingChat

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white dark:bg-[#16171d]">
      <div className="hidden w-80 shrink-0 sm:block">
        {isLoadingFriends && !conversations.length ? (
          <div className="flex h-full items-center justify-center border-r border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-sm text-gray-500 dark:text-zinc-400">Loading chats...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex h-full flex-col border-r border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex h-full items-center justify-center p-6 text-center">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">No friends yet</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">Add friends from search to start chatting</p>
              </div>
            </div>
          </div>
        ) : (
          <ChatSidebar
            conversations={conversations}
            activeId={activeId}
            onSelect={setActiveId}
            filter={filter}
            onFilterChange={setFilter}
            isOnline={isOnline}
          />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sm:hidden border-b border-gray-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900">
          {isLoadingFriends && !conversations.length ? (
            <p className="py-2 text-center text-sm text-gray-500 dark:text-zinc-400">Loading...</p>
          ) : conversations.length === 0 ? (
            <p className="py-2 text-center text-sm text-gray-500 dark:text-zinc-400">No friends yet</p>
          ) : (
            <select
              value={activeId ?? ''}
              onChange={(e) => setActiveId(e.target.value || null)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            >
              <option value="">Select chat</option>
              {conversations.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.username}
                </option>
              ))}
            </select>
          )}
        </div>
        {isLoading && activeId ? (
          <div className="flex flex-1 items-center justify-center bg-gray-50 dark:bg-[#16171d]">
            <p className="text-sm text-gray-500 dark:text-zinc-400">Loading messages...</p>
          </div>
        ) : (
          <ChatWindow
            conversation={activeConversation}
            messages={uiMessages}
            onSend={handleSend}
            isOnline={activeId ? isOnline(activeId) : undefined}
            lastSeen={activeId ? lastSeen(activeId) : null}
          />
        )}
      </div>
    </div>
  )
}
