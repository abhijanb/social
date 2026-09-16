import { useCallback, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import PostFeed from '../features/posts/components/PostFeed'
import { useGetTagPostsQuery } from '../features/posts/hashtagsApi'
import { useDeletePostMutation, useToggleLikeMutation, type Post } from '../features/posts/postsApi'
import { useAuth } from '../features/auth/hooks/useAuth'

type PageChunk = { page: number; posts: Post[]; nextPage: number | null }

// TagPage – friends-only hashtag feed at /tag/:tag, newest first.
// Same chunk + optimistic like/delete pattern as useFeed, scoped to one tag.
export default function TagPage() {
  const { tag: rawTag = '' } = useParams<{ tag: string }>()
  const tag = rawTag.replace(/^#+/, '').toLowerCase()
  const { isAuthenticated } = useAuth()
  const [page, setPage] = useState(1)
  const [chunks, setChunks] = useState<PageChunk[]>([])
  const [prevTag, setPrevTag] = useState(tag)
  const [likePending, setLikePending] = useState<Set<string>>(new Set())
  const [toggleLike] = useToggleLikeMutation()
  const [deletePost] = useDeletePostMutation()

  if (prevTag !== tag) {
    setPrevTag(tag)
    setPage(1)
    setChunks([])
  }

  const { data, isLoading, isFetching, error } = useGetTagPostsQuery(
    { tag, page },
    { skip: !isAuthenticated || !tag },
  )

  if (data && !chunks.some((c) => c.page === page)) {
    setChunks([...chunks, { page, posts: data.posts, nextPage: data.nextPage }])
  }

  const posts = chunks.flatMap((c) => c.posts)
  const visiblePosts = posts.length > 0 ? posts : (data?.posts ?? [])
  const nextPage = chunks.length > 0 ? chunks[chunks.length - 1].nextPage : data?.nextPage ?? null

  const patchPost = useCallback((postId: string, patch: (post: Post) => Post) => {
    setChunks((prev) =>
      prev.map((chunk) => ({
        ...chunk,
        posts: chunk.posts.map((post) => (post.id === postId ? patch(post) : post)),
      })),
    )
  }, [])

  const handleToggleLike = useCallback(
    async (postId: string) => {
      const current = chunks.flatMap((c) => c.posts).find((p) => p.id === postId)
      if (!current || likePending.has(postId)) return
      const flipped: Post = {
        ...current,
        likedByMe: !current.likedByMe,
        likesCount: current.likesCount + (current.likedByMe ? -1 : 1),
      }
      patchPost(postId, () => flipped)
      setLikePending((prev) => new Set(prev).add(postId))
      try {
        const res = await toggleLike({ postId }).unwrap()
        patchPost(postId, (post) => ({ ...post, likedByMe: res.liked, likesCount: res.likesCount }))
      } catch {
        patchPost(postId, () => current)
      } finally {
        setLikePending((prev) => {
          const next = new Set(prev)
          next.delete(postId)
          return next
        })
      }
    },
    [chunks, likePending, patchPost, toggleLike],
  )

  const handleDeleted = useCallback(
    async (postId: string) => {
      const prev = chunks
      setChunks((prevChunks) =>
        prevChunks.map((chunk) => ({
          ...chunk,
          posts: chunk.posts.filter((post) => post.id !== postId),
        })),
      )
      try {
        await deletePost({ postId }).unwrap()
      } catch {
        setChunks(prev)
      }
    },
    [chunks, deletePost],
  )

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 px-4 py-6 dark:bg-[#16171d]">
      <div className="mx-auto max-w-xl">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">#{tag}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">Friends-only posts with this hashtag</p>
        <PostFeed
          posts={visiblePosts}
          isLoading={isLoading || isFetching}
          hasMore={nextPage !== null}
          onLoadMore={() => nextPage && setPage(nextPage)}
          onToggleLike={handleToggleLike}
          likePendingIds={likePending}
          onPostDeleted={handleDeleted}
        />
      </div>
    </div>
  )
}
