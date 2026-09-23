import type { RefObject } from 'react'
import { isUnauthorizedError } from '../../../app/apiError'
import type { Message } from '../types'
import MessageBubble from './MessageBubble'

// MessageList – dumb scrollable message list for ChatWindow with bottom anchor. No hooks here.
// A (non-401) history failure renders an error instead of "No messages yet";
// 401 falls through to empty since the chat hooks log out on it.
export default function MessageList({
  messages,
  historyError,
  bottomRef,
}: {
  messages: Message[]
  historyError?: unknown
  bottomRef: RefObject<HTMLDivElement | null>
}) {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      {messages.length === 0 ? (
        historyError && !isUnauthorizedError(historyError) ? (
          <p className="mt-8 text-center text-sm text-red-600 dark:text-red-400">Couldn&apos;t load messages.</p>
        ) : (
          <p className="mt-8 text-center text-sm text-gray-500 dark:text-zinc-400">No messages yet. Say hello!</p>
        )
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
