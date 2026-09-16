import { isUnauthorizedError } from '../../../app/apiError'
import { useStoryComposer } from '../hooks/useStoryComposer'
import StoryFilePicker from './StoryFilePicker'
import StoryPreview from './StoryPreview'

// StoryComposer – thin shell for posting a story: overlay + header +
// picker/preview + errors. Logic lives in useStoryComposer.
export default function StoryComposer({ onClose, onCreated }: { onClose: () => void; onCreated?: () => void }) {
  const {
    file,
    preview,
    text,
    setText,
    pickError,
    isLoading,
    error,
    canShare,
    handlePick,
    handleClear,
    handlePost,
  } = useStoryComposer({ onClose, onCreated })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">New story</h2>
          <button
            onClick={onClose}
            aria-label="Close story composer"
            className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!preview ? (
          <StoryFilePicker onPick={handlePick} />
        ) : (
          <StoryPreview
            file={file}
            preview={preview}
            text={text}
            setText={setText}
            isLoading={isLoading}
            canShare={canShare}
            onClear={handleClear}
            onPost={handlePost}
          />
        )}

        {pickError && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{pickError}</p>}
        {error && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">
            {isUnauthorizedError(error) ? 'Session expired, please login again' : 'Failed to share story'}
          </p>
        )}
      </div>
    </div>
  )
}
