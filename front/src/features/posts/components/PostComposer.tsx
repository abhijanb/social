import { useState } from 'react'
import { useCreatePostMutation } from '../postsApi'

const MAX_LENGTH = 2200

// PostComposer – text box for writing a new post (max 2200 chars) with live counter and Post button.
export default function PostComposer({ onCreated }: { onCreated?: () => void }) {
  const [text, setText] = useState('')
  const [createPost, { isLoading, error }] = useCreatePostMutation()

  const trimmed = text.trim()
  const overLimit = text.length > MAX_LENGTH
  const canPost = !!trimmed && !overLimit && !isLoading

  const handlePost = async () => {
    if (!canPost) return
    try {
      await createPost({ text: trimmed }).unwrap()
      setText('')
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
      <div className="mt-2 flex items-center justify-between">
        <p className={`text-xs ${overLimit ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-zinc-500'}`}>
          {text.length}/{MAX_LENGTH}
        </p>
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
