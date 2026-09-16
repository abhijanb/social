import { useState } from 'react'
import type { StoryFeedGroup } from '../storiesApi'
import StoryComposer from './StoryComposer'
import StoryViewer from './StoryViewer'

// StoriesBar – Instagram-style horizontal tray above the feed: "Your story"
// tile with + composer first, then one tile per friend group. Gradient ring
// when hasUnseen, gray when all seen. Click opens StoryViewer.
export default function StoriesBar({
  groups,
  meId,
  meUsername,
  isLoading,
}: {
  groups: StoryFeedGroup[] | undefined
  meId: string | undefined
  meUsername: string | undefined
  isLoading: boolean
}) {
  const [composerOpen, setComposerOpen] = useState(false)
  const [viewing, setViewing] = useState<{ group: StoryFeedGroup; index: number } | null>(null)

  if (isLoading) {
    return (
      <div className="mb-4 flex gap-3 overflow-hidden rounded-2xl border border-gray-200 bg-white p-3 dark:border-zinc-700/80 dark:bg-zinc-900">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex w-16 shrink-0 flex-col items-center gap-1.5">
            <div className="h-14 w-14 animate-pulse rounded-full bg-gray-200 dark:bg-zinc-700" />
            <div className="h-2.5 w-10 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
          </div>
        ))}
      </div>
    )
  }

  const mine = groups?.find((g) => g.author.id === meId)
  const others = groups?.filter((g) => g.author.id !== meId) ?? []

  return (
    <>
      <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900">
        <div className="flex gap-3 overflow-x-auto pb-1">
          {/* Your story tile */}
          <button
            onClick={() => {
              if (mine && mine.stories.length > 0) setViewing({ group: mine, index: 0 })
              else setComposerOpen(true)
            }}
            className="flex w-16 shrink-0 flex-col items-center gap-1.5"
          >
            <span className={`rounded-full p-0.5 ${mine && mine.stories.length > 0 ? (mine.hasUnseen ? 'bg-gradient-to-tr from-[#aa3bff] via-fuchsia-500 to-amber-400' : 'bg-gray-300 dark:bg-zinc-600') : 'bg-gray-200 dark:bg-zinc-700'}`}>
              <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white text-base font-bold text-gray-900 dark:bg-zinc-900 dark:text-white">
                {(meUsername ?? '?').charAt(0).toUpperCase()}
                <span
                  role="button"
                  aria-label="Add story"
                  onClick={(e) => {
                    e.stopPropagation()
                    setComposerOpen(true)
                  }}
                  className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-violet-600 text-xs font-bold text-white dark:border-zinc-900"
                >
                  +
                </span>
              </span>
            </span>
            <span className="w-full truncate text-center text-[11px] text-gray-600 dark:text-zinc-400">Your story</span>
          </button>

          {others.map((g) => (
            <button
              key={g.author.id}
              onClick={() => setViewing({ group: g, index: 0 })}
              className="flex w-16 shrink-0 flex-col items-center gap-1.5"
            >
              <span className={`rounded-full p-0.5 ${g.hasUnseen ? 'bg-gradient-to-tr from-[#aa3bff] via-fuchsia-500 to-amber-400' : 'bg-gray-300 dark:bg-zinc-600'}`}>
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-base font-bold text-gray-900 dark:bg-zinc-900 dark:text-white">
                  {g.author.username.charAt(0).toUpperCase()}
                </span>
              </span>
              <span className="w-full truncate text-center text-[11px] text-gray-600 dark:text-zinc-400">{g.author.username}</span>
            </button>
          ))}

          {(!groups || groups.length <= 1) && (
            <p className="self-center whitespace-nowrap text-xs text-gray-400 dark:text-zinc-500">
              {others.length === 0 ? 'Share a moment — lasts 24h' : ''}
            </p>
          )}
        </div>
      </div>

      {composerOpen && <StoryComposer onClose={() => setComposerOpen(false)} />}

      {viewing && (
        <StoryViewer
          group={viewing.group}
          initialIndex={viewing.index}
          isOwn={viewing.group.author.id === meId}
          onClose={() => setViewing(null)}
        />
      )}
    </>
  )
}
