import { isStoryVideoFile } from '../storiesApi'
import { MAX_CAPTION } from '../hooks/useStoryComposer'

// StoryPreview – dumb preview + caption + actions for StoryComposer. No hooks here.
export default function StoryPreview({
  file,
  preview,
  text,
  setText,
  isLoading,
  canShare,
  onClear,
  onPost,
}: {
  file: File | null
  preview: string
  text: string
  setText: (v: string) => void
  isLoading: boolean
  canShare: boolean
  onClear: () => void
  onPost: () => void
}) {
  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-700">
        {file && isStoryVideoFile(file) ? (
          <video src={preview} muted playsInline controls preload="metadata" className="max-h-72 w-full bg-black object-contain" />
        ) : (
          <img src={preview} alt="Story preview" className="max-h-72 w-full bg-black object-contain" />
        )}
      </div>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={MAX_CAPTION}
        placeholder="Add a caption… (optional)"
        aria-label="Story caption"
        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-violet-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500"
      />
      <div className="flex items-center justify-between">
        <button
          onClick={onClear}
          className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          Choose different
        </button>
        <button
          onClick={onPost}
          disabled={!canShare}
          className="rounded-full bg-gradient-to-r from-violet-600 to-[#aa3bff] px-5 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLoading ? 'Sharing…' : 'Share'}
        </button>
      </div>
    </div>
  )
}
