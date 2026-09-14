import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../features/auth/hooks/useAuth'
import ChatSidebar from '../features/chat/components/ChatSidebar'
import ChatWindow from '../features/chat/components/ChatWindow'
import type { Conversation, Message } from '../features/chat/types'
import { useGetMeQuery } from '../features/users/usersApi'
import { useGetFriendsQuery } from '../features/friendship/friendshipApi'
import { usePresence } from '../features/presence/usePresence'
import { useChat } from '../features/chat/useChat'
import { useAppDispatch } from '../app/hooks'
import { logout } from '../features/auth/authSlice'

function isUnauthorizedError(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 401
}

export default function ChatPage() {
  const { isAuthenticated } = useAuth()
  const dispatch = useAppDispatch()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [filter, setFilter] = useState('')

  const { data: me, error: meError } = useGetMeQuery(undefined, { skip: !isAuthenticated })
  const currentUserId = me?.id

  useEffect(() => {
    if (isUnauthorizedError(meError)) dispatch(logout())
  }, [meError, dispatch])

  const { data: friends, isLoading: isLoadingFriends, error: friendsError } = useGetFriendsQuery(currentUserId!, {
    skip: !currentUserId,
  })

  useEffect(() => {
    if (isUnauthorizedError(friendsError)) dispatch(logout())
  }, [friendsError, dispatch])

  const conversations: Conversation[] = useMemo(() => {
    if (!friends) return []
    return friends.map((f) => ({
      id: f.friend.id,
      username: f.friend.username,
      avatar: f.friend.username.charAt(0).toUpperCase(),
      lastMessage: '',
    }))
  }, [friends])

  const friendIds = useMemo(() => conversations.map((c) => c.id), [conversations])
  const { isOnline, lastSeen } = usePresence(friendIds)

  const { messages: chatMessages, isLoading: isLoadingChat, send } = useChat(activeId)

  useEffect(() => {
    if (!activeId && conversations.length > 0) setActiveId(conversations[0].id)
    if (activeId && conversations.length > 0 && !conversations.find((c) => c.id === activeId)) {
      setActiveId(conversations[0].id)
    }
    if (conversations.length === 0) setActiveId(null)
  }, [conversations, activeId])

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (isUnauthorizedError(meError) || isUnauthorizedError(friendsError)) return <Navigate to="/login" replace />

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null

  const uiMessages: Message[] = useMemo(() => {
    if (!currentUserId) return []
    return chatMessages.map((m) => ({
      id: m.id,
      text: m.text,
      sender: m.senderId === currentUserId ? 'me' : 'other',
      at: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }))
  }, [chatMessages, currentUserId])

  const handleSend = (text: string) => {
    void send(text)
  }

  const isLoading = (isLoadingFriends && !friends) || isLoadingChat

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white dark:bg-[#16171d]">
      <div className="hidden w-80 shrink-0 sm:block">
        {isLoadingFriends && !friends ? (
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
          {isLoadingFriends && !friends ? (
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
