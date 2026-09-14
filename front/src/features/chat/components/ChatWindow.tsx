import { useEffect, useRef, useState } from 'react'
import type { Conversation, Message } from '../types'
import MessageBubble from './MessageBubble'

type Props = {
  conversation: Conversation | null
  messages: Message[]
  onSend: (text: string) => void
}

export default function ChatWindow({ conversation, messages, onSend }: Props) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!conversation) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gray-50 dark:bg-[#16171d]">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm dark:bg-zinc-800">
            <svg className="h-6 w-6 text-gray-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">Select a chat</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">Choose a conversation from the sidebar</p>
        </div>
      </div>
    )
  }

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    onSend(trimmed)
    setInput('')
  }

  return (
    <div className="flex flex-1 flex-col bg-gray-50 dark:bg-[#16171d]">
      <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-[#aa3bff] text-xs font-semibold text-white">
          {conversation.avatar}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{conversation.username}</p>
          <p className="text-xs text-green-600 dark:text-green-400">Online</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="mt-8 text-center text-sm text-gray-500 dark:text-zinc-400">No messages yet. Say hello!</p>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Type a message..."
            className="flex-1 rounded-full border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="rounded-full bg-[#aa3bff] p-2.5 text-white shadow-sm transition hover:bg-[#9835e6] disabled:opacity-40 disabled:cursor-not-allowed dark:bg-violet-600 dark:hover:bg-violet-700"
            aria-label="Send message"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
