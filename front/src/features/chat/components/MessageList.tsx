import type { RefObject } from 'react'
import type { Message } from '../types'
import MessageBubble from './MessageBubble'

// MessageList – dumb scrollable message list for ChatWindow with bottom anchor. No hooks here.
export default function MessageList({
  messages,
  bottomRef,
}: {
  messages: Message[]
  bottomRef: RefObject<HTMLDivElement | null>
}) {
  return (
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
  )
}
