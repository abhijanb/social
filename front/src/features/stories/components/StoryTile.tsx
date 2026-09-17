import Avatar from '../../../components/Avatar'

// StoryTile – dumb gradient-ring tray tile for StoriesBar: avatar + label,
// optional + badge. Merges the Your-story and friend tiles. No hooks here.
export default function StoryTile({
  username,
  avatarUrl,
  ring,
  label,
  showAdd,
  onOpen,
  onAdd,
}: {
  username: string
  avatarUrl?: string | null
  ring: 'gradient' | 'muted' | 'empty'
  label: string
  showAdd?: boolean
  onOpen: () => void
  onAdd?: () => void
}) {
  const ringClass =
    ring === 'gradient'
      ? 'bg-gradient-to-tr from-[#aa3bff] via-fuchsia-500 to-amber-400'
      : ring === 'muted'
        ? 'bg-gray-300 dark:bg-zinc-600'
        : 'bg-gray-200 dark:bg-zinc-700'
  return (
    <button onClick={onOpen} className="flex w-16 shrink-0 flex-col items-center gap-1.5">
      <span className={`rounded-full p-0.5 ${ringClass}`}>
        <span className="relative flex rounded-full bg-white p-0.5 dark:bg-zinc-900">
          <Avatar username={username} avatarUrl={avatarUrl ?? null} size="lg" />
          {showAdd && (
            <span
              role="button"
              aria-label="Add story"
              onClick={(e) => {
                e.stopPropagation()
                onAdd?.()
              }}
              className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-violet-600 text-xs font-bold text-white dark:border-zinc-900"
            >
              +
            </span>
          )}
        </span>
      </span>
      <span className="w-full truncate text-center text-[11px] text-gray-600 dark:text-zinc-400">{label}</span>
    </button>
  )
}
