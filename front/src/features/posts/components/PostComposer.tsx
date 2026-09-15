import { useState } from 'react'
import { useCreatePostMutation } from '../postsApi'

const MAX_LENGTH = 2200

// PostComposer – text box for writing a new post (max 2200 chars) with live counter,
// optional single image attach + preview, and Post button. Needs text, image, or both.
export default function PostComposer({ onCreated }: { onCreated?: () => void }) {
  const [text, setText] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [createPost, { isLoading, error }] = useCreatePostMutation()

  const trimmed = text.trim()
  const overLimit = text.length > MAX_LENGTH
  const canPost = (!!trimmed || !!image) && !overLimit && !isLoading

  const handlePick = (file: File | undefined) => {
    if (!file) return
    setImage(file)
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
  }

  const handleRemoveImage = () => {
    setImage(null)
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
  }

  const handlePost = async () => {
    if (!canPost) return
    try {
      await createPost({ text: trimmed, image }).unwrap()
      setText('')
      handleRemoveImage()
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
      {preview && (
        <div className="relative mt-2">
          <img src={preview} alt="Attachment preview" className="max-h-64 w-full rounded-lg object-cover" />
          <button
            onClick={handleRemoveImage}
            aria-label="Remove image"
            className="absolute right-2 top-2 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white hover:bg-black/80"
          >
            Remove
          </button>
        </div>
      )}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className={`text-xs ${overLimit ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-zinc-500'}`}>
            {text.length}/{MAX_LENGTH}
          </p>
          <label className="cursor-pointer rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800">
            Add image
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => handlePick(e.target.files?.[0])}
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
