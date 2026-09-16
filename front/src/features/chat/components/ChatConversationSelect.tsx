import type { Conversation } from '../types'

// ChatConversationSelect – dumb mobile <select> for /chat:
// loading / empty / conversation options. No hooks here.
export default function ChatConversationSelect({
  conversations,
  activeId,
  isLoadingFriends,
  onChange,
}: {
  conversations: Conversation[]
  activeId: string | null
  isLoadingFriends: boolean
  onChange: (id: string | null) => void
}) {
  if (isLoadingFriends && !conversations.length) {
    return <p className="py-2 text-center text-sm text-gray-500 dark:text-zinc-400">Loading...</p>
  }
  if (conversations.length === 0) {
    return <p className="py-2 text-center text-sm text-gray-500 dark:text-zinc-400">No friends yet</p>
  }
  return (
    <select
      value={activeId ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
    >
      <option value="">Select chat</option>
      {conversations.map((c) => (
        <option key={c.id} value={c.id}>
          {c.username}
        </option>
      ))}
    </select>
  )
}
