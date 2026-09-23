import { useEffect, useRef, useState } from 'react'
import type { Message } from '../types'

// useChatWindowInput – draft + autoscroll + send for ChatWindow, no JSX.
// The draft clears only when onSend reports success, so a failed send stays
// editable for retry instead of being lost.
export function useChatWindowInput(messages: Message[], onSend: (text: string) => Promise<boolean>) {
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || sending) return
    setSending(true)
    try {
      const delivered = await onSend(trimmed)
      if (delivered) setInput('')
    } finally {
      setSending(false)
    }
  }

  return { input, setInput, bottomRef, handleSend, canSend: !!input.trim() && !sending }
}
