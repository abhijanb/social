import { useParams } from 'react-router-dom'
import PostFeed from '../features/posts/components/PostFeed'
import { useTagFeed } from '../features/posts/hooks/useTagFeed'

// TagPage – thin shell for /tag/:tag: header + PostFeed.
// Auth is gated by ProtectedLayout; stale sessions log out via useTagFeed.
export default function TagPage() {
  const { tag: rawTag = '' } = useParams<{ tag: string }>()
  const {
    tag,
    visiblePosts,
    nextPage,
    isLoading,
    isFetching,
    likePending,
    handleLoadMore,
    handleToggleLike,
    handleCommentAdded,
    handleCommentDeleted,
    handleDeleted,
  } = useTagFeed(rawTag)

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 px-4 py-6 dark:bg-[#16171d]">
      <div className="mx-auto max-w-xl">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">#{tag}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">Friends-only posts with this hashtag</p>
        <PostFeed
          posts={visiblePosts}
          isLoading={isLoading || isFetching}
          hasMore={nextPage !== null}
          onLoadMore={handleLoadMore}
          onToggleLike={handleToggleLike}
          likePendingIds={likePending}
          onCommentAdded={handleCommentAdded}
          onCommentDeleted={handleCommentDeleted}
          onPostDeleted={handleDeleted}
        />
      </div>
    </div>
  )
}
