import { useState } from 'react'
import { ACCEPT_STORY_MEDIA, isStoryVideoFile, MAX_STORY_BYTES_IMAGE, MAX_STORY_BYTES_VIDEO, useCreateStoryMutation } from '../storiesApi'

function fileTooBig(file: File): boolean {
  return isStoryVideoFile(file) ? file.size > MAX_STORY_BYTES_VIDEO : file.size > MAX_STORY_BYTES_IMAGE
}

// StoryComposer – modal for posting a single story (image/video + optional
// 220-char caption). Triggered by the "+" tile in StoriesBar.
export default function StoryComposer({ onClose, onCreated }: { onClose: () => void; onCreated?: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [pickError, setPickError] = useState<string | null>(null)
  const [createStory, { isLoading, error }] = useCreateStoryMutation()

  const handlePick = (files: FileList | undefined) => {
    if (!files || files.length === 0) return
    const picked = files[0]
    if (fileTooBig(picked)) {
      setPickError('File too large (images max 5MB, videos max 50MB)')
      return
    }
    setPickError(null)
    if (preview) URL.revokeObjectURL(preview)
    setFile(picked)
    setPreview(URL.createObjectURL(picked))
  }

  const handlePost = async () => {
    if (!file || isLoading) return
    try {
      await createStory({ text: text.trim(), media: file }).unwrap()
      if (preview) URL.revokeObjectURL(preview)
      onCreated?.()
      onClose()
    } catch {
      // surfaces via `error` below
    }
  }

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
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 px-4 py-10 text-center transition hover:border-violet-400 hover:bg-violet-50/50 dark:border-zinc-700 dark:hover:border-violet-500 dark:hover:bg-violet-500/5">
            <svg className="h-8 w-8 text-gray-400 dark:text-zinc-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <span className="text-sm font-medium text-gray-600 dark:text-zinc-300">Pick a photo or video</span>
            <span className="text-xs text-gray-400 dark:text-zinc-500">Expires in 24h • friends-only</span>
            <input
              type="file"
              accept={ACCEPT_STORY_MEDIA}
              className="hidden"
              onChange={(e) => {
                handlePick(e.target.files ?? undefined)
                e.target.value = ''
              }}
            />
          </label>
        ) : (
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
              maxLength={220}
              placeholder="Add a caption… (optional)"
              aria-label="Story caption"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-violet-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500"
            />
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  if (preview) URL.revokeObjectURL(preview)
                  setFile(null)
                  setPreview(null)
                }}
                className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                Choose different
              </button>
              <button
                onClick={handlePost}
                disabled={!file || isLoading}
                className="rounded-full bg-gradient-to-r from-violet-600 to-[#aa3bff] px-5 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isLoading ? 'Sharing…' : 'Share'}
              </button>
            </div>
          </div>
        )}

        {pickError && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{pickError}</p>}
        {error && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">
            {'status' in error && error.status === 401 ? 'Session expired, please login again' : 'Failed to share story'}
          </p>
        )}
      </div>
    </div>
  )
}
