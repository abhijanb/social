import { useCallback, useEffect, useRef, useState } from 'react'
import { resolveImageUrl } from '../../posts/resolvePostImage'
import { useDeleteStoryMutation, useMarkStoryViewedMutation, type StoryFeedGroup } from '../storiesApi'

const IMAGE_DURATION_MS = 5000

function timeLeft(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) return 'expired'
  const h = Math.floor(ms / 3600000)
  if (h >= 1) return `${h}h left`
  const m = Math.floor(ms / 60000)
  return `${Math.max(1, m)}m left`
}

// StoryViewer – fullscreen Instagram-style viewer for one author's stories:
// progress bars, auto-advance (5s per image, video-ended for videos),
// caption, views count, delete-own, prev/next + Esc to close.
export default function StoryViewer({
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

  if (!story) return null
  const src = resolveImageUrl(story.url)

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-black shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bars */}
        <div className="absolute inset-x-2 top-2 z-10 flex gap-1">
          {group.stories.map((s, i) => (
            <div key={s.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
              <div
                className={`h-full rounded-full bg-white transition-all ${
                  i < index ? 'w-full' : i === index ? (s.kind === 'VIDEO' ? 'w-full animate-pulse' : 'w-full') : 'w-0'
                }`}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute inset-x-0 top-5 z-10 flex items-center gap-2 bg-gradient-to-b from-black/70 to-transparent px-3 pb-6 pt-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-[#aa3bff] text-xs font-bold text-white">
            {group.author.username.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold text-white">{group.author.username}</p>
            <p className="text-xs text-white/70">
              {timeLeft(story.expiresAt)} {story.viewsCount > 0 && `• ${story.viewsCount} seen`}
            </p>
          </div>
          {isOwn && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-full px-2.5 py-1 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              {isDeleting ? '…' : 'Delete'}
            </button>
          )}
          <button
            onClick={onClose}
            aria-label="Close story"
            className="rounded-full p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Media */}
        {src && story.kind === 'VIDEO' ? (
          <video
            key={story.id}
            src={src}
            autoPlay
            controls
            playsInline
            onEnded={() => setIndex((i) => (i + 1 < group.stories.length ? i + 1 : i))}
            className="aspect-[9/16] max-h-[75vh] w-full bg-black object-contain"
          />
        ) : (
          src && <img key={story.id} src={src} alt={`Story by ${group.author.username}`} className="aspect-[9/16] max-h-[75vh] w-full bg-black object-contain" />
        )}

        {/* Caption */}
        {story.text && (
          <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 pt-10 text-sm text-white">
            {story.text}
          </p>
        )}

        {/* Prev / next hit areas */}
        <button
          aria-label="Previous story"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          className="absolute inset-y-0 left-0 w-1/3"
        />
        <button
          aria-label="Next story"
          onClick={() => {
            if (index + 1 < group.stories.length) setIndex(index + 1)
            else onClose()
          }}
          className="absolute inset-y-0 right-0 w-1/3"
        />
      </div>
    </div>
  )
}
