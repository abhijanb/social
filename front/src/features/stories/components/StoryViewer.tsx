import Avatar from '../../../components/Avatar'
import { timeLeft, useStoryViewer } from '../hooks/useStoryViewer'
import type { StoryFeedGroup } from '../storiesApi'

// StoryViewer – fullscreen Instagram-style viewer for one author's stories:
// progress bars, auto-advance (5s per image, video-ended for videos),
// caption, views count, delete-own, prev/next + Esc to close.
// Playback + navigation logic live in useStoryViewer; this file is props + JSX only.
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
  const { index, story, src, isDeleting, handleDelete, goPrev, goNext, goVideoEnded } = useStoryViewer({
    group,
    initialIndex,
    isOwn,
    onClose,
    onDeleted,
  })

  if (!story) return null

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
          <Avatar username={group.author.username} avatarUrl={group.author.avatarUrl} size="sm" />
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
            onEnded={goVideoEnded}
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
          onClick={goPrev}
          className="absolute inset-y-0 left-0 w-1/3"
        />
        <button
          aria-label="Next story"
          onClick={goNext}
          className="absolute inset-y-0 right-0 w-1/3"
        />
      </div>
    </div>
  )
}
