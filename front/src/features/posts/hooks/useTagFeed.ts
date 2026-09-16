import { useCallback, useState } from 'react'
import { useAuth } from '../../auth/hooks/useAuth'
import { useGetTagPostsQuery } from '../hashtagsApi'
import { useDeletePostMutation, useToggleLikeMutation, type Post } from '../postsApi'

type PageChunk = { page: number; posts: Post[]; nextPage: number | null }

// useTagFeed – all data + interaction logic for the friends-only hashtag
// feed, no JSX: tag normalization + reset, page-chunk collection,
// optimistic like toggles, comment-count patches, optimistic deletes.
// Mirrors useFeed, scoped to one tag.
export function useTagFeed(rawTag: string) {
  const tag = rawTag.replace(/^#+/, '').toLowerCase()
  const { isAuthenticated } = useAuth()
  const [page, setPage] = useState(1)
  const [chunks, setChunks] = useState<PageChunk[]>([])
  const [prevTag, setPrevTag] = useState(tag)
  const [likePending, setLikePending] = useState<Set<string>>(new Set())
  const [toggleLike] = useToggleLikeMutation()
  const [deletePost] = useDeletePostMutation()

  // Reset pagination when switching tags (render-time guard, same as useFeed).
  if (prevTag !== tag) {
    setPrevTag(tag)
    setPage(1)
    setChunks([])
  }

  const { data, isLoading, isFetching, error } = useGetTagPostsQuery(
    { tag, page },
    { skip: !isAuthenticated || !tag },
  )

  // Each page is cached separately by RTK Query; collect fetched pages here.
  if (data && !chunks.some((c) => c.page === page)) {
    setChunks([...chunks, { page, posts: data.posts, nextPage: data.nextPage }])
  }

  const posts = chunks.flatMap((c) => c.posts)
  const visiblePosts = posts.length > 0 ? posts : (data?.posts ?? [])
  const nextPage = chunks.length > 0 ? chunks[chunks.length - 1].nextPage : (data?.nextPage ?? null)

  const handleLoadMore = useCallback(() => {
    if (nextPage) setPage(nextPage)
  }, [nextPage])

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

  const handleCommentAdded = useCallback(
    (postId: string) => {
      patchPost(postId, (post) => ({ ...post, commentsCount: (post.commentsCount ?? 0) + 1 }))
    },
    [patchPost],
  )

  const handleCommentDeleted = useCallback(
    (postId: string) => {
      patchPost(postId, (post) => ({ ...post, commentsCount: Math.max(0, (post.commentsCount ?? 1) - 1) }))
    },
    [patchPost],
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

  return {
    tag,
    isAuthenticated,
    visiblePosts,
    nextPage,
    isLoading,
    isFetching,
    error,
    likePending,
    handleLoadMore,
    handleToggleLike,
    handleCommentAdded,
    handleCommentDeleted,
    handleDeleted,
  }
}
