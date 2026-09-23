import type { StoryFeedGroup } from '../storiesApi'
import { useStoriesBar } from '../hooks/useStoriesBar'
import { isUnauthorizedError } from '../../../app/apiError'
import StoriesBarSkeleton from './StoriesBarSkeleton'
import StoryComposer from './StoryComposer'
import StoryTile from './StoryTile'
import StoryViewer from './StoryViewer'

// StoriesBar – thin shell: Instagram-style horizontal tray above the feed.
// State + derivations live in useStoriesBar, tiles in StoryTile.
// A (non-401) feed failure shows an inline error instead of the "Share a
// moment" hint so it doesn't look like there are simply no stories.
export default function StoriesBar({
  groups,
  meId,
  meUsername,
  meAvatarUrl,
  isLoading,
  storiesError,
}: {
  groups: StoryFeedGroup[] | undefined
  meId: string | undefined
  meUsername: string | undefined
  meAvatarUrl?: string | null
  isLoading: boolean
  storiesError?: unknown
}) {
  const { composerOpen, viewing, mine, others, openMine, openGroup, openComposer, closeComposer, closeViewer } =
    useStoriesBar(groups, meId)

  if (isLoading) return <StoriesBarSkeleton />

  const showStoriesError = !!storiesError && !isUnauthorizedError(storiesError)

  const mineRing =
    mine && mine.stories.length > 0 ? (mine.hasUnseen ? 'gradient' : 'muted') : ('empty' as const)

  return (
    <>
      <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900">
        <div className="flex gap-3 overflow-x-auto pb-1">
          <StoryTile
            username={meUsername ?? '?'}
            avatarUrl={meAvatarUrl ?? mine?.author.avatarUrl}
            ring={mineRing}
            label="Your story"
            showAdd
            onOpen={openMine}
            onAdd={openComposer}
          />

          {others.map((g) => (
            <StoryTile
              key={g.author.id}
              username={g.author.username}
              avatarUrl={g.author.avatarUrl}
              ring={g.hasUnseen ? 'gradient' : 'muted'}
              label={g.author.username}
              onOpen={() => openGroup(g)}
            />
          ))}

          {showStoriesError ? (
            <p className="self-center whitespace-nowrap text-xs text-red-600 dark:text-red-400">
              Couldn&apos;t load stories.
            </p>
          ) : (
            (!groups || groups.length <= 1) && (
              <p className="self-center whitespace-nowrap text-xs text-gray-400 dark:text-zinc-500">
                {others.length === 0 ? 'Share a moment — lasts 24h' : ''}
              </p>
            )
          )}
        </div>
      </div>

      {composerOpen && <StoryComposer onClose={closeComposer} />}

      {viewing && (
        <StoryViewer
          group={viewing.group}
          initialIndex={viewing.index}
          isOwn={viewing.group.author.id === meId}
          onClose={closeViewer}
        />
      )}
    </>
  )
}
