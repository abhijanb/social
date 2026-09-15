import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../features/auth/hooks/useAuth'
import { useGetFeedQuery, type Post } from '../features/posts/postsApi'
import PostComposer from '../features/posts/components/PostComposer'
import PostFeed from '../features/posts/components/PostFeed'

const FIRST_PAGE = 1

// FeedPage – friends-only posts feed: composer on top, page-based post list below (auth required).
export default function FeedPage() {
  const { isAuthenticated } = useAuth()
  const [page, setPage] = useState(FIRST_PAGE)
  const [posts, setPosts] = useState<Post[]>([])
  const [nextPage, setNextPage] = useState<number | null>(null)
  const { data, isLoading, isFetching, error } = useGetFeedQuery(page === FIRST_PAGE ? undefined : { page }, {
    skip: !isAuthenticated,
  })

  useEffect(() => {
    if (!data) return
    setPosts((prev) => {
      // Page 1 (re)load replaces the list; later pages append.
      if (page === FIRST_PAGE) return data.posts
      const ids = new Set(prev.map((p) => p.id))
      return [...prev, ...data.posts.filter((p) => !ids.has(p.id))]
    })
    setNextPage(data.nextPage)
  }, [data, page])

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
    return <Navigate to="/login" replace />
  }

  const handleCreated = () => {
    setPosts([])
    setNextPage(null)
    setPage(FIRST_PAGE)
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 px-4 py-8 dark:bg-[#16171d]">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Feed</h1>
        <PostComposer onCreated={handleCreated} />
        {error && !(typeof error === 'object' && 'status' in error && error.status === 401) && (
          <p className="mt-6 text-center text-sm text-red-600 dark:text-red-400">Failed to load feed</p>
        )}
        <PostFeed
          posts={posts}
          isLoading={isLoading || isFetching}
          hasMore={nextPage !== null}
          onLoadMore={() => nextPage && setPage(nextPage)}
        />
      </div>
    </div>
  )
}
