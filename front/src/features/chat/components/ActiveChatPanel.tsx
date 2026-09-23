import type { Conversation, Message } from '../types'
import ChatWindow from './ChatWindow'

// ActiveChatPanel – dumb message area for /chat: loading vs window.
// Data + callbacks come from the page.
export default function ActiveChatPanel({
  activeId,
  isLoading,
  conversation,
  messages,
  onSend,
  sendError,
  isOnline,
  lastSeen,
}: {
  activeId: string | null
  isLoading: boolean
  conversation: Conversation | null
  messages: Message[]
  onSend: (text: string) => Promise<boolean>
  sendError?: unknown
  isOnline?: boolean
  lastSeen?: string | null
}) {
  if (isLoading && activeId) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gray-50 dark:bg-[#16171d]">
        <p className="text-sm text-gray-500 dark:text-zinc-400">Loading messages...</p>
      </div>
    )
  }
  return (
    <ChatWindow
      conversation={conversation}
      messages={messages}
      onSend={onSend}
      sendError={sendError}
      isOnline={isOnline}
      lastSeen={lastSeen}
    />
  )
}
