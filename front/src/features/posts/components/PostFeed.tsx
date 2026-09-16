import type { Post } from '../postsApi'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import PostCard from './PostCard'
import PostSkeleton from './PostSkeleton'

type Props = {
  posts: Post[]
  isLoading: boolean
  hasMore: boolean
  onLoadMore: () => void
  onToggleLike?: (postId: string) => void
  likePendingIds?: Set<string>
  onCommentAdded?: (postId: string) => void
}

// PostFeed – renders the list of posts with loading/empty states;
// next pages load automatically via infinite scroll (sentinel observed with IntersectionObserver).
export default function PostFeed({ posts, isLoading, hasMore, onLoadMore, onToggleLike, likePendingIds, onCommentAdded }: Props) {
  // Infinite scroll – sentinel triggers the next page load when scrolled into view.
  const sentinelRef = useInfiniteScroll({ hasMore, isLoading, onLoadMore })

  if (isLoading && posts.length === 0) {
    return (
      <div className="mt-4 space-y-4">
        <PostSkeleton />
        <PostSkeleton withMedia={false} />
        <PostSkeleton />
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-gray-300 px-6 py-12 text-center dark:border-zinc-600">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-[#aa3bff]">
          <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        </div>
        <p className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">No posts yet</p>
        <p className="mx-auto mt-1 max-w-xs text-sm text-gray-500 dark:text-zinc-400">
          Share your first moment above, or find friends from search to fill your feed
        </p>
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onToggleLike={onToggleLike}
          likePending={likePendingIds?.has(post.id) ?? false}
          onCommentAdded={onCommentAdded}
        />
      ))}
      {hasMore && <div ref={sentinelRef} aria-hidden="true" className="h-1" />}
      {isLoading && (
        <PostSkeleton withMedia={false} />
      )}
      {!hasMore && (
        <div className="flex items-center gap-3 py-4">
          <div className="h-px flex-1 bg-gray-200 dark:bg-zinc-700" />
          <p className="text-xs font-medium text-gray-400 dark:text-zinc-500">You&apos;re all caught up</p>
          <div className="h-px flex-1 bg-gray-200 dark:bg-zinc-700" />
        </div>
      )}
    </div>
  )
}
