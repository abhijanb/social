import { useCallback, useState } from 'react'
import { useAuth } from '../../auth/hooks/useAuth'
import { useGetSavedPostsQuery, useDeletePostMutation, useToggleLikeMutation, useToggleSaveMutation, type Post } from '../postsApi'

type PageChunk = { page: number; posts: Post[]; nextPage: number | null }

// useSavedFeed – all data + interaction logic for the private saved-posts
// page, no JSX: page-chunk collection, optimistic like/save toggles,
// comment-count patches, optimistic deletes. Mirrors useFeed, sourced from
// getSavedPosts (own saves, newest first).
export function useSavedFeed() {
  const { isAuthenticated } = useAuth()
  const [page, setPage] = useState(1)
  const [chunks, setChunks] = useState<PageChunk[]>([])
  const [likePending, setLikePending] = useState<Set<string>>(new Set())
  const [savePending, setSavePending] = useState<Set<string>>(new Set())
  const [toggleLike] = useToggleLikeMutation()
  const [toggleSave] = useToggleSaveMutation()
  const [deletePost] = useDeletePostMutation()
  const { data, isLoading, isFetching, error } = useGetSavedPostsQuery(page === 1 ? undefined : { page }, {
    skip: !isAuthenticated,
  })

  // Each page is cached separately by RTK Query; collect fetched pages here
  // (render-time adjustment, not an effect, so no flash of uncollected data).
  // The guard lives inside the functional updater: a double-invoked render
  // sees the same stale `chunks` in both passes, but the updaters run
  // sequentially — the second sees the first's append and returns prev, so
  // a page can never be collected twice (no duplicated posts/keys).
  if (data && !chunks.some((c) => c.page === page)) {
    setChunks((prev) =>
      prev.some((c) => c.page === page) ? prev : [...prev, { page, posts: data.posts, nextPage: data.nextPage }],
    )
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

  const handleToggleSave = useCallback(
    async (postId: string) => {
      const current = chunks.flatMap((c) => c.posts).find((p) => p.id === postId)
      if (!current || savePending.has(postId)) return
      patchPost(postId, () => ({ ...current, savedByMe: !current.savedByMe }))
      setSavePending((prev) => new Set(prev).add(postId))
      try {
        const res = await toggleSave({ postId }).unwrap()
        patchPost(postId, (post) => ({ ...post, savedByMe: res.saved }))
      } catch {
        patchPost(postId, () => current)
      } finally {
        setSavePending((prev) => {
          const next = new Set(prev)
          next.delete(postId)
          return next
        })
      }
    },
    [chunks, savePending, patchPost, toggleSave],
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

  // Unsaving removes the post from this list on next fetch; deleting drops
  // it from collected chunks optimistically, revert on failure.
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
    visiblePosts,
    nextPage,
    isLoading,
    isFetching,
    error,
    likePending,
    savePending,
    handleLoadMore,
    handleToggleLike,
    handleToggleSave,
    handleCommentAdded,
    handleCommentDeleted,
    handleDeleted,
  }
}
