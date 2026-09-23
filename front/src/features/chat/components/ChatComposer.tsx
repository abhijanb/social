// ChatComposer – dumb message input for ChatWindow: Enter-to-send + button. No hooks here.
import { MAX_MESSAGE_LENGTH } from '../schema'
export default function ChatComposer({
  input,
  setInput,
  canSend,
  overLimit,
  onSend,
}: {
  input: string
  setInput: (v: string) => void
  canSend: boolean
  overLimit: boolean
  onSend: () => void
}) {
  return (
    <div className="border-t border-gray-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onSend()
            }
          }}
          placeholder="Type a message..."
          className="flex-1 rounded-full border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500 dark:focus:bg-zinc-800"
        />
        <button
          onClick={onSend}
          disabled={!canSend}
          className="rounded-full bg-[#aa3bff] p-2.5 text-white shadow-sm transition hover:bg-[#9835e6] disabled:opacity-40 disabled:cursor-not-allowed dark:bg-violet-600 dark:hover:bg-violet-700"
          aria-label="Send message"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
      {overLimit && (
        <p className="mt-1.5 pl-1 text-xs text-red-600 dark:text-red-400">
          Message too long (max {MAX_MESSAGE_LENGTH} characters)
        </p>
      )}
    </div>
  )
}
