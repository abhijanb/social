import type { Post } from '../postsApi'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import PostCard from './PostCard'

type Props = {
  posts: Post[]
  isLoading: boolean
  hasMore: boolean
  onLoadMore: () => void
}

// PostFeed – renders the list of posts with loading/empty states;
// next pages load automatically via infinite scroll (sentinel observed with IntersectionObserver).
export default function PostFeed({ posts, isLoading, hasMore, onLoadMore }: Props) {
  // Infinite scroll – sentinel triggers the next page load when scrolled into view.
  const sentinelRef = useInfiniteScroll({ hasMore, isLoading, onLoadMore })

  if (isLoading && posts.length === 0) {
    return <p className="mt-6 text-center text-sm text-gray-500 dark:text-zinc-400">Loading feed...</p>
  }

  if (posts.length === 0) {
    return (
      <div className="mt-6 text-center">
        <p className="text-sm font-medium text-gray-900 dark:text-white">No posts yet</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
          Be the first to post, or add friends from search to see their posts
        </p>
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      {hasMore && <div ref={sentinelRef} aria-hidden="true" className="h-1" />}
      {isLoading && (
        <p className="py-2 text-center text-sm text-gray-500 dark:text-zinc-400">Loading more...</p>
      )}
      {!hasMore && (
        <p className="py-2 text-center text-sm text-gray-400 dark:text-zinc-500">You&apos;re all caught up</p>
      )}
    </div>
  )
}
