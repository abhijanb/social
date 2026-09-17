import { useState } from 'react'
import type { StoryFeedGroup } from '../storiesApi'

// useStoriesBar – tray state + group derivation for StoriesBar, no JSX:
// composer/viewer modals, own vs friends groups, open handlers.
export function useStoriesBar(groups: StoryFeedGroup[] | undefined, meId: string | undefined) {
  const [composerOpen, setComposerOpen] = useState(false)
  const [viewing, setViewing] = useState<{ group: StoryFeedGroup; index: number } | null>(null)

  const mine = groups?.find((g) => g.author.id === meId)
  const others = groups?.filter((g) => g.author.id !== meId) ?? []

  const openMine = () => {
    if (mine && mine.stories.length > 0) setViewing({ group: mine, index: 0 })
    else setComposerOpen(true)
  }

  const openGroup = (group: StoryFeedGroup) => {
    setViewing({ group, index: 0 })
  }

  const openComposer = () => {
    setComposerOpen(true)
  }

  const closeComposer = () => {
    setComposerOpen(false)
  }

  const closeViewer = () => {
    setViewing(null)
  }

  return {
    composerOpen,
    viewing,
    mine,
    others,
    openMine,
    openGroup,
    openComposer,
    closeComposer,
    closeViewer,
  }
}
