import { Navigate } from 'react-router-dom'
import { useAuth } from '../features/auth/hooks/useAuth'
import ActiveChatPanel from '../features/chat/components/ActiveChatPanel'
import ChatConversationSelect from '../features/chat/components/ChatConversationSelect'
import ChatSidebarPanel from '../features/chat/components/ChatSidebarPanel'
import { useChatConversations } from '../features/chat/hooks/useChatConversations'
import { useActiveChat } from '../features/chat/hooks/useActiveChat'
import { isUnauthorizedError } from '../app/apiError'

// ChatPage – thin shell for /chat: guards + sidebar/select + message panel.
// Data lives in useChatConversations/useActiveChat, states in components.
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
        <ChatSidebarPanel
          conversations={conversations}
          isLoadingFriends={isLoadingFriends}
          activeId={activeId}
          onSelect={setActiveId}
          filter={filter}
          onFilterChange={setFilter}
          isOnline={isOnline}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sm:hidden border-b border-gray-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900">
          <ChatConversationSelect
            conversations={conversations}
            activeId={activeId}
            isLoadingFriends={isLoadingFriends}
            onChange={setActiveId}
          />
        </div>
        <ActiveChatPanel
          activeId={activeId}
          isLoading={isLoading}
          conversation={activeConversation}
          messages={uiMessages}
          onSend={handleSend}
          isOnline={activeId ? isOnline(activeId) : undefined}
          lastSeen={activeId ? lastSeen(activeId) : null}
        />
      </div>
    </div>
  )
}
