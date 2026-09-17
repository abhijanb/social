import { useMemo } from 'react'
import { useChat } from './useChat'
import type { Message } from '../types'

export function useActiveChat(activeId: string | null, currentUserId?: string) {
  const { messages: chatMessages, isLoading: isLoadingChat, send } = useChat(activeId)

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

  return { uiMessages, isLoadingChat, handleSend }
}
