import { useEffect, useState, useCallback } from 'react'
import { useGetHistoryQuery, useSendMessageMutation, type ChatMessage } from '../chatApi'
import { getChatSocket, disconnectChatSocket } from '../socket'
import { useAuth } from '../../auth/hooks/useAuth'
import { useGetMeQuery } from '../../users/usersApi'
import { useAppDispatch } from '../../../app/hooks'
import { isUnauthorizedError } from '../../../app/apiError'
import { logout } from '../../auth/authSlice'

export function useChat(friendId: string | null) {
  const { isAuthenticated } = useAuth()
  const dispatch = useAppDispatch()
  const { data: me } = useGetMeQuery(undefined, { skip: !isAuthenticated })
  const currentUserId = me?.id

  const { data: history, error: historyError, isLoading, refetch } = useGetHistoryQuery(
    { friendId: friendId! },
    { skip: !friendId || !isAuthenticated },
  )

  useEffect(() => {
    if (isUnauthorizedError(historyError)) dispatch(logout())
  }, [historyError, dispatch])

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sendMessageMutation, { isLoading: isSending }] = useSendMessageMutation()

  useEffect(() => {
    if (history) setMessages(history)
    else if (!friendId) setMessages([])
  }, [history, friendId])

  const appendIfRelevant = useCallback(
    (msg: ChatMessage) => {
      if (!friendId || !currentUserId) return
      const isRelevant =
        (msg.senderId === currentUserId && msg.receiverId === friendId) ||
        (msg.senderId === friendId && msg.receiverId === currentUserId)
      if (isRelevant) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev
          return [...prev, msg]
        })
      }
    },
    [friendId, currentUserId],
  )

  useEffect(() => {
    if (!isAuthenticated || !friendId) return
    const socket = getChatSocket()
    const handler = (payload: { message: ChatMessage }) => {
      if (payload?.message) appendIfRelevant(payload.message)
    }
    socket.on('chat:receive', handler)
    return () => {
      socket.off('chat:receive', handler)
    }
  }, [isAuthenticated, friendId, appendIfRelevant])

  useEffect(() => {
    if (!isAuthenticated) disconnectChatSocket()
  }, [isAuthenticated])

  const send = useCallback(
    async (text: string) => {
      if (!friendId || !text.trim()) return
      const trimmed = text.trim()
      // try socket first
      const socket = getChatSocket()
      if (socket.connected) {
        const ack: { ok: boolean; error?: string; message?: ChatMessage } = await new Promise((resolve) => {
          socket.emit('chat:send', { to: friendId, text: trimmed }, (res: unknown) => resolve(res as never))
          setTimeout(() => resolve({ ok: false, error: 'timeout' }), 3000)
        })
        if (ack?.ok && ack.message) {
          appendIfRelevant(ack.message)
          return ack.message
        }
        // fallback to REST on socket failure
      }
      const msg = await sendMessageMutation({ receiverId: friendId, text: trimmed }).unwrap()
      appendIfRelevant(msg)
      return msg
    },
    [friendId, appendIfRelevant, sendMessageMutation],
  )

  return { messages, isLoading, isSending, send, refetch, currentUserId }
}
