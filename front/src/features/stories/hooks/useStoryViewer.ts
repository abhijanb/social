import { useCallback, useEffect, useRef, useState } from 'react'
import { resolveImageUrl } from '../../posts/resolvePostImage'
import { useDeleteStoryMutation, useMarkStoryViewedMutation, type StoryFeedGroup } from '../storiesApi'

export const IMAGE_DURATION_MS = 5000

export function timeLeft(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) return 'expired'
  const h = Math.floor(ms / 3600000)
  if (h >= 1) return `${h}h left`
  const m = Math.floor(ms / 60000)
  return `${Math.max(1, m)}m left`
}

// useStoryViewer – all viewer logic for one author's stories, no JSX:
// index state, image auto-advance timer, keyboard nav, idempotent
// viewed-marking, delete-own with last-story close vs step-back.
export function useStoryViewer({
  group,
  initialIndex = 0,
  isOwn,
  onClose,
  onDeleted,
}: {
  group: StoryFeedGroup
  initialIndex?: number
  isOwn: boolean
  onClose: () => void
  onDeleted?: () => void
}) {
  const [index, setIndex] = useState(initialIndex)
  const [markViewed] = useMarkStoryViewedMutation()
  const [deleteStory, { isLoading: isDeleting }] = useDeleteStoryMutation()
  const timer = useRef<number | null>(null)
  const story = group.stories[index]

  const clearTimer = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
  }, [])

  // Mark current story viewed (friends-only idempotent POST).
  useEffect(() => {
    if (!story || (story.viewedByMe && !isOwn)) return
    if (story.authorId !== group.author.id) return
    // Own views are harmless (upsert) but skip to avoid noise.
    if (isOwn) return
    markViewed({ storyId: story.id }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id])

  // Auto-advance for images; videos advance onEnded.
  useEffect(() => {
    clearTimer()
    if (!story || story.kind === 'VIDEO') return
    timer.current = window.setTimeout(() => {
      setIndex((i) => (i + 1 < group.stories.length ? i + 1 : i))
    }, IMAGE_DURATION_MS)
    return clearTimer
  }, [story, group.stories.length, clearTimer])

  // If we reach the end via auto-advance on the last image, close.
  useEffect(() => {
    if (!story) onClose()
  }, [story, onClose])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, group.stories.length - 1))
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [group.stories.length, onClose])

  const src = story ? resolveImageUrl(story.url) : null

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1))
  }, [])

  const goNext = useCallback(() => {
    if (index + 1 < group.stories.length) setIndex(index + 1)
    else onClose()
  }, [index, group.stories.length, onClose])

  const goVideoEnded = useCallback(() => {
    setIndex((i) => (i + 1 < group.stories.length ? i + 1 : i))
  }, [group.stories.length])

  const handleDelete = async () => {
    if (isDeleting) return
    try {
      await deleteStory({ storyId: story.id }).unwrap()
      // If that was the last story, close; else step back.
      if (group.stories.length <= 1) {
        onDeleted?.()
        onClose()
      } else {
        onDeleted?.()
        setIndex((i) => Math.max(0, i - 1))
      }
    } catch {
      // stays open so retry is easy
    }
  }

  return {
    index,
    story,
    src,
    isDeleting,
    handleDelete,
    goPrev,
    goNext,
    goVideoEnded,
  }
}
