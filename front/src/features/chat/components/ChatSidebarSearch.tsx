// ChatSidebarSearch – dumb search input for ChatSidebar. No hooks here.
export default function ChatSidebarSearch({
  filter,
  onFilterChange,
}: {
  filter: string
  onFilterChange: (v: string) => void
}) {
  return (
    <div className="border-b border-gray-200 p-3 dark:border-zinc-700">
      <div className="relative">
        <input
          value={filter}
          onChange={(e) => onFilterChange(e.target.value)}
          placeholder="Search chats..."
          className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500 dark:focus:bg-zinc-800"
        />
        <svg className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
      </div>
    </div>
  )
}
