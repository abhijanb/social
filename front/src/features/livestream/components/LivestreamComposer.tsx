// LivestreamComposer – dumb comment input for a live room. Draft state owned here,
// parent sends via onSend. No hooks here.
export const MAX_LIVESTREAM_COMMENT = 500

export default function LivestreamComposer({
  draft,
  onChange,
  onSubmit,
  isSending,
  disabled,
}: {
  draft: string
  onChange: (v: string) => void
  onSubmit: () => void
  isSending: boolean
  disabled: boolean
}) {
  return (
    <div className="flex gap-2 border-t border-gray-200 p-3 dark:border-zinc-700">
      <input
        value={draft}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSubmit()
        }}
        placeholder="Add a comment..."
        maxLength={MAX_LIVESTREAM_COMMENT + 50}
        className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
      />
      <button
        onClick={onSubmit}
        disabled={disabled}
        className="shrink-0 rounded-lg bg-[#aa3bff] px-4 py-1.5 text-sm font-medium text-white transition hover:bg-[#9835e6] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-violet-600 dark:hover:bg-violet-700"
      >
        {isSending ? '...' : 'Send'}
      </button>
    </div>
  )
}
