import type { Post } from '../postsApi'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import PostCard from './PostCard'
import PostFeedEmpty from './PostFeedEmpty'
import PostFeedEnd from './PostFeedEnd'
import PostFeedLoading from './PostFeedLoading'
import PostSkeleton from './PostSkeleton'

type Props = {
  posts: Post[]
  isLoading: boolean
  hasMore: boolean
  onLoadMore: () => void
  onToggleLike?: (postId: string) => void
  likePendingIds?: Set<string>
  onCommentAdded?: (postId: string) => void
  onCommentDeleted?: (postId: string) => void
  onPostDeleted?: (postId: string) => void
}

// PostFeed – thin shell: post list with loading/empty/end states.
// States live in sibling components; next pages load automatically via
// infinite scroll (sentinel observed with IntersectionObserver).
export default function PostFeed({ posts, isLoading, hasMore, onLoadMore, onToggleLike, likePendingIds, onCommentAdded, onCommentDeleted, onPostDeleted }: Props) {
  // Infinite scroll – sentinel triggers the next page load when scrolled into view.
  const sentinelRef = useInfiniteScroll({ hasMore, isLoading, onLoadMore })

  if (isLoading && posts.length === 0) return <PostFeedLoading />

  if (posts.length === 0) return <PostFeedEmpty />

  return (
    <div className="mt-4 space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onToggleLike={onToggleLike}
          likePending={likePendingIds?.has(post.id) ?? false}
          onCommentAdded={onCommentAdded}
          onCommentDeleted={onCommentDeleted}
          onPostDeleted={onPostDeleted}
        />
      ))}
      {hasMore && <div ref={sentinelRef} aria-hidden="true" className="h-1" />}
      {isLoading && (
        <PostSkeleton withMedia={false} />
      )}
      {!hasMore && <PostFeedEnd />}
    </div>
  )
}
