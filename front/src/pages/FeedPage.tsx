import { useCallback, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAppDispatch } from '../app/hooks'
import { baseApi } from '../app/baseApi'
import { useAuth } from '../features/auth/hooks/useAuth'
import { useGetFeedQuery, type Post } from '../features/posts/postsApi'
import { useGetMeQuery } from '../features/users/usersApi'
import PostComposer from '../features/posts/components/PostComposer'
import PostFeed from '../features/posts/components/PostFeed'

const FIRST_PAGE = 1

type PageChunk = { page: number; posts: Post[]; nextPage: number | null }

// FeedPage – friends-only posts feed: composer on top, page-based post list below (auth required).
export default function FeedPage() {
  const { isAuthenticated } = useAuth()
  const dispatch = useAppDispatch()
  const [page, setPage] = useState(FIRST_PAGE)
  const [chunks, setChunks] = useState<PageChunk[]>([])
  const { data, isLoading, isFetching, error } = useGetFeedQuery(page === FIRST_PAGE ? undefined : { page }, {
    skip: !isAuthenticated,
  })
  const { data: me } = useGetMeQuery(undefined, { skip: !isAuthenticated })

  // Each page is cached separately by RTK Query; collect fetched pages here.
  // Guarded so each page is added once (render-time adjustment, not an effect).
  if (data && !chunks.some((c) => c.page === page)) {
    setChunks([...chunks, { page, posts: data.posts, nextPage: data.nextPage }])
  }

  const posts = chunks.flatMap((c) => c.posts)
  const nextPage = chunks.length > 0 ? chunks[chunks.length - 1].nextPage : null

  // Stable identity so PostFeed's observer effect only re-subscribes when the target page changes.
  const handleLoadMore = useCallback(() => {
    if (nextPage) setPage(nextPage)
  }, [nextPage])

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
    return <Navigate to="/login" replace />
  }

  const handleCreated = () => {
    // New post belongs on top of page 1 – drop collected pages and reload fresh.
    setChunks([])
    setPage(FIRST_PAGE)
    dispatch(baseApi.util.resetApiState())
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 px-4 py-6 dark:bg-[#16171d]">
      <div className="mx-auto max-w-xl">
        {/* PostComposer – avatar + input row for writing a new post. */}
        <PostComposer onCreated={handleCreated} username={me?.username} />
        {error && !(typeof error === 'object' && 'status' in error && error.status === 401) && (
          <p className="mt-6 text-center text-sm text-red-600 dark:text-red-400">Failed to load feed</p>
        )}
        {/* PostFeed – the list of posts with loading/empty states and "Load more". */}
        <PostFeed
          posts={posts}
          isLoading={isLoading || isFetching}
          hasMore={nextPage !== null}
          onLoadMore={handleLoadMore}
        />
      </div>
    </div>
  )
}
