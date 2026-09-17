import { useEffect, useRef, useState } from 'react'
import type { Message } from '../types'

// useChatWindowInput – draft + autoscroll + send for ChatWindow, no JSX.
export function useChatWindowInput(messages: Message[], onSend: (text: string) => void) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    onSend(trimmed)
    setInput('')
  }

  return { input, setInput, bottomRef, handleSend, canSend: !!input.trim() }
}
