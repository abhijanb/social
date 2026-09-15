import { useState } from 'react'
import { MAX_POST_IMAGES, useCreatePostMutation } from '../postsApi'

const MAX_LENGTH = 2200

// PostComposer – text box for writing a new post (max 2200 chars) with live counter,
// optional multi-image attach (up to MAX_POST_IMAGES) + previews, and Post button.
// Needs text, at least one image, or both.
export default function PostComposer({ onCreated }: { onCreated?: () => void }) {
  const [text, setText] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [createPost, { isLoading, error }] = useCreatePostMutation()

  const trimmed = text.trim()
  const overLimit = text.length > MAX_LENGTH
  const canPost = (!!trimmed || images.length > 0) && !overLimit && !isLoading

  const handlePick = (files: FileList | undefined) => {
    if (!files) return
    const picked = Array.from(files)
    if (picked.length === 0) return
    const room = MAX_POST_IMAGES - images.length
    const accepted = picked.slice(0, Math.max(0, room))
    if (accepted.length === 0) return
    setImages((prev) => [...prev, ...accepted])
    setPreviews((prev) => [...prev, ...accepted.map((f) => URL.createObjectURL(f))])
  }

  const handleRemoveAt = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => {
      const url = prev[index]
      if (url) URL.revokeObjectURL(url)
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleClearImages = () => {
    setImages([])
    setPreviews((prev) => {
      for (const url of prev) URL.revokeObjectURL(url)
      return []
    })
  }

  const handlePost = async () => {
    if (!canPost) return
    try {
      await createPost({ text: trimmed, images }).unwrap()
      setText('')
      handleClearImages()
      onCreated?.()
    } catch {
      // error surfaces via `error` below
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What's on your mind?"
        rows={3}
        maxLength={MAX_LENGTH + 100}
        className="w-full resize-none rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500 dark:focus:bg-zinc-800"
      />
      {previews.length > 0 && (
        <div className="mt-2 grid grid-cols-3 gap-2">
          {previews.map((src, i) => (
            <div key={`${src}-${i}`} className="relative">
              <img
                src={src}
                alt={`Attachment preview ${i + 1}`}
                className="h-24 w-full rounded-lg object-cover"
              />
              <button
                onClick={() => handleRemoveAt(i)}
                aria-label={`Remove image ${i + 1}`}
                className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white hover:bg-black/80"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className={`text-xs ${overLimit ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-zinc-500'}`}>
            {text.length}/{MAX_LENGTH}
          </p>
          <label className="cursor-pointer rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800">
            {images.length > 0 ? `Add images (${images.length}/${MAX_POST_IMAGES})` : 'Add images'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={(e) => {
                handlePick(e.target.files ?? undefined)
                e.target.value = ''
              }}
            />
          </label>
        </div>
        <button
          onClick={handlePost}
          disabled={!canPost}
          className="rounded-lg bg-[#aa3bff] px-4 py-1.5 text-sm font-medium text-white transition hover:bg-[#9835e6] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-violet-600 dark:hover:bg-violet-700"
        >
          {isLoading ? 'Posting...' : 'Post'}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {'status' in error && error.status === 401 ? 'Session expired, please login again' : 'Failed to post'}
        </p>
      )}
    </div>
  )
}
