// ChatEmptyState – dumb placeholder for ChatWindow with no conversation selected. No hooks here.
export default function ChatEmptyState() {
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
