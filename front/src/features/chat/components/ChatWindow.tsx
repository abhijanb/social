import type { Conversation, Message } from '../types'
import { useChatWindowInput } from '../hooks/useChatWindowInput'
import ActionErrorBanner from '../../../components/ActionErrorBanner'
import { chatActionErrorMessage } from './chatActionError'
import ChatComposer from './ChatComposer'
import ChatEmptyState from './ChatEmptyState'
import ChatWindowHeader from './ChatWindowHeader'
import MessageList from './MessageList'

type Props = {
  conversation: Conversation | null
  messages: Message[]
  onSend: (text: string) => Promise<boolean>
  sendError?: unknown
  isOnline?: boolean
  lastSeen?: string | null
}

// ChatWindow – thin shell: empty state or header + list + composer.
// Input + autoscroll live in useChatWindowInput, regions in parts.
export default function ChatWindow({ conversation, messages, onSend, sendError, isOnline, lastSeen }: Props) {
  const { input, setInput, bottomRef, handleSend, canSend } = useChatWindowInput(messages, onSend)

  if (!conversation) return <ChatEmptyState />

  return (
    <div className="flex flex-1 flex-col bg-gray-50 dark:bg-[#16171d]">
      <ChatWindowHeader conversation={conversation} isOnline={isOnline} lastSeen={lastSeen} />
      <MessageList messages={messages} bottomRef={bottomRef} />
      <ActionErrorBanner
        error={sendError}
        getMessage={chatActionErrorMessage}
        className="px-4 py-2 text-center text-sm text-red-600 dark:text-red-400"
      />
      <ChatComposer input={input} setInput={setInput} canSend={canSend} onSend={handleSend} />
    </div>
  )
}
