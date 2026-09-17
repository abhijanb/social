import type { Conversation, Message } from '../types'
import { useChatWindowInput } from '../hooks/useChatWindowInput'
import ChatComposer from './ChatComposer'
import ChatEmptyState from './ChatEmptyState'
import ChatWindowHeader from './ChatWindowHeader'
import MessageList from './MessageList'

type Props = {
  conversation: Conversation | null
  messages: Message[]
  onSend: (text: string) => void
  isOnline?: boolean
  lastSeen?: string | null
}

// ChatWindow – thin shell: empty state or header + list + composer.
// Input + autoscroll live in useChatWindowInput, regions in parts.
export default function ChatWindow({ conversation, messages, onSend, isOnline, lastSeen }: Props) {
  const { input, setInput, bottomRef, handleSend, canSend } = useChatWindowInput(messages, onSend)

  if (!conversation) return <ChatEmptyState />

  return (
    <div className="flex flex-1 flex-col bg-gray-50 dark:bg-[#16171d]">
      <ChatWindowHeader conversation={conversation} isOnline={isOnline} lastSeen={lastSeen} />
      <MessageList messages={messages} bottomRef={bottomRef} />
      <ChatComposer input={input} setInput={setInput} canSend={canSend} onSend={handleSend} />
    </div>
  )
}
