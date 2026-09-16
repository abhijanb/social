import Avatar from '../../../components/Avatar'
import { ACCEPT_MEDIA, MAX_POST_IMAGES, isVideoFile } from '../postsApi'
import { MAX_LENGTH, usePostComposer } from '../hooks/usePostComposer'

// PostComposer – avatar + input row for writing a new post (max 2200 chars),
// optional media attach (up to MAX_POST_IMAGES images/videos mixed) + previews,
// and a pill Post button. Needs text, at least one attachment, or both.
// Compose state + posting logic live in usePostComposer; this file is props + JSX only.
export default function PostComposer({ onCreated, username, avatarUrl }: { onCreated?: () => void; username?: string; avatarUrl?: string | null }) {
  const {
    text,
    setText,
    images,
    previews,
    pickError,
    isLoading,
    error,
    overLimit,
    canPost,
    handlePick,
    handleRemoveAt,
    handlePost,
  } = usePostComposer({ onCreated })

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900 dark:shadow-black/20">
      <div className="flex gap-3">
        <div className="shrink-0">
          <Avatar username={username ?? '?'} avatarUrl={avatarUrl} size="md" className="!h-10 !w-10" />
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's on your mind?"
          rows={3}
          maxLength={MAX_LENGTH + 100}
          className="min-w-0 flex-1 resize-none rounded-xl border border-transparent bg-gray-100 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500 dark:focus:border-violet-500 dark:focus:bg-zinc-800"
        />
      </div>
      {previews.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 pl-12">
          {previews.map((src, i) => (
            <div key={`${src}-${i}`} className="group relative">
              {isVideoFile(images[i]) ? (
                <video
                  src={src}
                  muted
                  preload="metadata"
                  playsInline
                  className="h-28 w-full rounded-xl border border-gray-200 object-cover dark:border-zinc-700"
                />
              ) : (
                <img
                  src={src}
                  alt={`Attachment preview ${i + 1}`}
                  className="h-28 w-full rounded-xl border border-gray-200 object-cover dark:border-zinc-700"
                />
              )}
              {isVideoFile(images[i]) && (
                <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  VIDEO
                </span>
              )}
              <button
                onClick={() => handleRemoveAt(i)}
                aria-label={`Remove attachment ${i + 1}`}
                className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white opacity-100 transition hover:bg-black/80 sm:opacity-0 sm:group-hover:opacity-100"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
      {pickError && (
        <p className="mt-2 pl-12 text-xs text-red-600 dark:text-red-400">{pickError}</p>
      )}
      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pl-12 pt-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <label
            title="Add photos or videos"
            className="flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-violet-600 transition hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-500/10"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            {images.length > 0 ? `${images.length}/${MAX_POST_IMAGES}` : 'Media'}
            <input
              type="file"
              accept={ACCEPT_MEDIA}
              multiple
              className="hidden"
              onChange={(e) => {
                handlePick(e.target.files ?? undefined)
                e.target.value = ''
              }}
            />
          </label>
          <p className={`text-xs tabular-nums ${overLimit ? 'font-medium text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-zinc-500'}`}>
            {text.length}/{MAX_LENGTH}
          </p>
        </div>
        <button
          onClick={handlePost}
          disabled={!canPost}
          className="rounded-full bg-gradient-to-r from-violet-600 to-[#aa3bff] px-6 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:saturate-50 dark:shadow-black/30"
        >
          {isLoading ? 'Posting...' : 'Post'}
        </button>
      </div>
      {error && (
        <p className="mt-2 pl-12 text-sm text-red-600 dark:text-red-400">
          {'status' in error && error.status === 401 ? 'Session expired, please login again' : 'Failed to post'}
        </p>
      )}
    </div>
  )
}
