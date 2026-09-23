import { useMemo } from 'react'
import { useChat } from './useChat'
import type { Message } from '../types'

export function useActiveChat(activeId: string | null, currentUserId?: string) {
  const { messages: chatMessages, isLoading: isLoadingChat, historyError, isSending, sendError, send } = useChat(activeId)

  const uiMessages: Message[] = useMemo(() => {
    if (!currentUserId) return []
    return chatMessages.map((m) => ({
      id: m.id,
      text: m.text,
      sender: m.senderId === currentUserId ? 'me' : 'other',
      at: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }))
  }, [chatMessages, currentUserId])

  // Returns true when the message was delivered; false keeps the caller's
  // draft so a failed send can be retried instead of retyped.
  const handleSend = async (text: string) => {
    const msg = await send(text)
    return msg !== null
  }

  return { uiMessages, isLoadingChat, historyError, isSending, sendError, handleSend }
}
