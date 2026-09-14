import type { Conversation } from '../types'

type Props = {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  filter: string
  onFilterChange: (v: string) => void
}

export default function ChatSidebar({ conversations, activeId, onSelect, filter, onFilterChange }: Props) {
  const filtered = conversations.filter((c) => c.username.toLowerCase().includes(filter.toLowerCase()))

  return (
    <div className="flex h-full w-full flex-col border-r border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
      <div className="border-b border-gray-200 p-3 dark:border-zinc-700">
        <div className="relative">
          <input
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            placeholder="Search chats..."
            className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
          />
          <svg className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-500 dark:text-zinc-400">No chats found</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-zinc-800">
            {filtered.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => onSelect(c.id)}
                  className={`flex w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-gray-50 dark:hover:bg-zinc-800 ${activeId === c.id ? 'bg-violet-50 dark:bg-zinc-800' : ''}`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-[#aa3bff] text-sm font-semibold text-white">
                    {c.avatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{c.username}</p>
                    <p className="truncate text-xs text-gray-500 dark:text-zinc-400">{c.lastMessage}</p>
                  </div>
                  {activeId === c.id && <span className="h-2 w-2 rounded-full bg-violet-500" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
