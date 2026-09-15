import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../features/auth/hooks/useAuth'
import { useGetFeedQuery } from '../features/posts/postsApi'
import PostComposer from '../features/posts/components/PostComposer'
import PostFeed from '../features/posts/components/PostFeed'

const PAGE_SIZE = 20

export default function FeedPage() {
  const { isAuthenticated } = useAuth()
  const [limit, setLimit] = useState(PAGE_SIZE)
  const { data: posts, isLoading, isFetching, error } = useGetFeedQuery({ limit }, { skip: !isAuthenticated })

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
    return <Navigate to="/login" replace />
  }

  const list = posts ?? []
  const hasMore = list.length >= limit

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 px-4 py-8 dark:bg-[#16171d]">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Feed</h1>
        <PostComposer />
        {error && !(typeof error === 'object' && 'status' in error && error.status === 401) && (
          <p className="mt-6 text-center text-sm text-red-600 dark:text-red-400">Failed to load feed</p>
        )}
        <PostFeed
          posts={list}
          isLoading={isLoading || isFetching}
          hasMore={hasMore}
          onLoadMore={() => setLimit((l) => l + PAGE_SIZE)}
        />
      </div>
    </div>
  )
}
