import type { Post } from '../postsApi'
import PostCard from './PostCard'

type Props = {
  posts: Post[]
  isLoading: boolean
  hasMore: boolean
  onLoadMore: () => void
}

// PostFeed – renders the list of posts with loading/empty states and a "Load more" button.
export default function PostFeed({ posts, isLoading, hasMore, onLoadMore }: Props) {
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
      {hasMore && (
        <button
          onClick={onLoadMore}
          disabled={isLoading}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
        >
          {isLoading ? 'Loading...' : 'Load more'}
        </button>
      )}
    </div>
  )
}
