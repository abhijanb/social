import { Navigate } from 'react-router-dom'
import StoriesBar from '../features/stories/components/StoriesBar'
import PostComposer from '../features/posts/components/PostComposer'
import PostFeed from '../features/posts/components/PostFeed'
import { useFeed } from '../features/posts/hooks/useFeed'
import { isUnauthorizedError } from '../app/apiError'

// FeedPage – friends-only posts feed: composer on top, page-based post list below (auth required).
// Data + interactions live in useFeed; this file is guards + JSX shell only.
export default function FeedPage() {
  const {
    isAuthenticated,
    posts,
    nextPage,
    isLoading,
    isFetching,
    error,
    likePending,
    storyGroups,
    storiesLoading,
    me,
    ownUsername,
    ownAvatarUrl,
    handleLoadMore,
    handleToggleLike,
    handleCommentAdded,
    handleCommentDeleted,
    handleCreated,
    handleDeleted,
  } = useFeed()

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (isUnauthorizedError(error)) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 px-4 py-6 dark:bg-[#16171d]">
      <div className="mx-auto max-w-xl">
        <StoriesBar groups={storyGroups} meId={me?.id} meUsername={ownUsername} meAvatarUrl={ownAvatarUrl} isLoading={storiesLoading} />
        {/* PostComposer – avatar + input row for writing a new post. */}
        <PostComposer onCreated={handleCreated} username={ownUsername} avatarUrl={ownAvatarUrl} />
        {error && !isUnauthorizedError(error) && (
          <p className="mt-6 text-center text-sm text-red-600 dark:text-red-400">Failed to load feed</p>
        )}
        {/* PostFeed – the list of posts with loading/empty states and "Load more". */}
        <PostFeed
          posts={posts}
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
