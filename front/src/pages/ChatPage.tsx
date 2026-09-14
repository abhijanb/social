import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../features/auth/hooks/useAuth'
import ChatSidebar from '../features/chat/components/ChatSidebar'
import ChatWindow from '../features/chat/components/ChatWindow'
import type { Conversation, Message } from '../features/chat/types'

const mockConversations: Conversation[] = [
  { id: '1', username: 'alice', avatar: 'A', lastMessage: 'Hey, how are you?' },
  { id: '2', username: 'bob', avatar: 'B', lastMessage: 'See you tomorrow!' },
  { id: '3', username: 'charlie', avatar: 'C', lastMessage: 'Thanks for the help' },
]

const mockMessages: Record<string, Message[]> = {
  '1': [
    { id: 'm1', text: 'Hey, how are you?', sender: 'other', at: '10:00 AM' },
    { id: 'm2', text: 'Doing great! Working on the project.', sender: 'me', at: '10:02 AM' },
  ],
  '2': [
    { id: 'm3', text: 'See you tomorrow!', sender: 'other', at: '09:30 AM' },
  ],
  '3': [],
}

function nowTime(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ChatPage() {
  const { isAuthenticated } = useAuth()
  const [activeId, setActiveId] = useState<string | null>('1')
  const [filter, setFilter] = useState('')
  const [messagesById, setMessagesById] = useState<Record<string, Message[]>>(mockMessages)

  if (!isAuthenticated) return <Navigate to="/login" replace />

  const activeConversation = mockConversations.find((c) => c.id === activeId) ?? null
  const activeMessages = activeId ? (messagesById[activeId] ?? []) : []

  const handleSend = (text: string) => {
    if (!activeId) return
    const msg: Message = { id: `${Date.now()}`, text, sender: 'me', at: nowTime() }
    setMessagesById((prev) => ({ ...prev, [activeId]: [...(prev[activeId] ?? []), msg] }))
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white dark:bg-[#16171d]">
      <div className="hidden w-80 shrink-0 sm:block">
        <ChatSidebar
          conversations={mockConversations}
          activeId={activeId}
          onSelect={setActiveId}
          filter={filter}
          onFilterChange={setFilter}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sm:hidden border-b border-gray-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900">
          <select
            value={activeId ?? ''}
            onChange={(e) => setActiveId(e.target.value || null)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
          >
            <option value="">Select chat</option>
            {mockConversations.map((c) => (
              <option key={c.id} value={c.id}>
                {c.username}
              </option>
            ))}
          </select>
        </div>
        <ChatWindow conversation={activeConversation} messages={activeMessages} onSend={handleSend} />
      </div>
    </div>
  )
}
