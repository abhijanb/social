import type { Post } from '../../posts/postsApi'
import { resolveImageUrl } from '../../posts/resolvePostImage'
import { isForbiddenError } from '../../../app/apiError'

function FirstTile({ post }: { post: Post }) {
  const first = [...(post.images ?? [])].sort((a, b) => a.order - b.order)[0]
  const src = resolveImageUrl(first?.url)
  if (src) {
    return (
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-zinc-800">
        {first.kind === 'VIDEO' ? (
          <>
            <video src={src} muted preload="metadata" playsInline className="h-full w-full object-cover" />
            <span className="absolute right-1.5 top-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              VIDEO
            </span>
          </>
        ) : (
          <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
        )}
      </div>
    )
  }
  return (
    <div className="flex aspect-square items-center justify-center overflow-hidden bg-gray-100 p-3 text-center dark:bg-zinc-800">
      <p className="line-clamp-4 text-xs leading-relaxed text-gray-700 dark:text-zinc-200">{post.text}</p>
    </div>
  )
}

// ProfilePostsGrid – dumb friends-only posts grid for /u/:username:
// private notice, skeletons, error, empty, 3-col grid + Load more.
export default function ProfilePostsGrid({
  posts,
  nextPage,
  postsLoading,
  postsFetching,
  postsError,
  canView,
  profileLoading,
  hasProfile,
  onLoadMore,
}: {
  posts: Post[]
  nextPage: number | null
  postsLoading: boolean
  postsFetching: boolean
  postsError: unknown
  canView: boolean
  profileLoading: boolean
  hasProfile: boolean
  onLoadMore: (page: number) => void
}) {
  return (
    <div className="mt-4">
      {!canView ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">This account is private</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">Become friends to see their posts.</p>
        </div>
      ) : (profileLoading && !hasProfile) || (postsLoading && posts.length === 0) ? (
        <div className="grid grid-cols-3 gap-1">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="aspect-square animate-pulse bg-gray-200 dark:bg-zinc-800" />
          ))}
        </div>
      ) : postsError && !isForbiddenError(postsError) ? (
        <p className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-red-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-red-400">
          Failed to load posts
        </p>
      ) : posts.length === 0 ? (
        <p className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          No posts yet.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-1 overflow-hidden rounded-xl">
            {posts.map((p) => (
              <FirstTile key={p.id} post={p} />
            ))}
          </div>
          {nextPage !== null && (
            <button
              onClick={() => onLoadMore(nextPage)}
              disabled={postsFetching}
              className="mx-auto mt-4 block rounded-full border border-gray-300 px-5 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              {postsFetching ? 'Loading…' : 'Load more'}
            </button>
          )}
        </>
      )}
    </div>
  )
}
