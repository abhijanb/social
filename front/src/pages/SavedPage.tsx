import PostFeed from '../features/posts/components/PostFeed'
import { useSavedFeed } from '../features/posts/hooks/useSavedFeed'

// SavedPage – thin shell for /saved: the viewer's own saved posts, newest
// save first. Fully private (server scopes by JWT, no authorId param).
// Auth is gated by ProtectedLayout. Data lives in useSavedFeed.
export default function SavedPage() {
  const {
    visiblePosts,
    nextPage,
    isLoading,
    isFetching,
    likePending,
    savePending,
    handleLoadMore,
    handleToggleLike,
    handleToggleSave,
    handleCommentAdded,
    handleCommentDeleted,
    handleDeleted,
  } = useSavedFeed()

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 px-4 py-6 dark:bg-[#16171d]">
      <div className="mx-auto max-w-xl">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Saved</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">Only you can see what you&apos;ve saved</p>
        <PostFeed
          posts={visiblePosts}
          isLoading={isLoading || isFetching}
          hasMore={nextPage !== null}
          onLoadMore={handleLoadMore}
          onToggleLike={handleToggleLike}
          likePendingIds={likePending}
          onToggleSave={handleToggleSave}
          savePendingIds={savePending}
          onCommentAdded={handleCommentAdded}
          onCommentDeleted={handleCommentDeleted}
          onPostDeleted={handleDeleted}
        />
      </div>
    </div>
  )
}
