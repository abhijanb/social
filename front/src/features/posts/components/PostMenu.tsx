// PostMenu – dumb owner menu for PostCard: ... toggle + Delete item.
// Open state + confirm live in usePostCard; no hooks here.
export default function PostMenu({
  menuOpen,
  onToggle,
  onClose,
  onDelete,
}: {
  menuOpen: boolean
  onToggle: () => void
  onClose: () => void
  onDelete: () => void
}) {
  return (
    <div className="relative shrink-0">
      <button
        onClick={onToggle}
        aria-label="Post options"
        className="rounded-full p-1.5 text-gray-500 transition hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
      </button>
      {menuOpen && (
        <>
          <button aria-label="Close menu" onClick={onClose} className="fixed inset-0 z-10 cursor-default" />
          <div className="absolute right-0 z-20 w-36 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
            <button
              onClick={onDelete}
              className="block w-full px-4 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  )
}
