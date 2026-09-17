import { useCallback, useEffect, useState } from 'react'
import { useAppDispatch } from '../../../app/hooks'
import { isUnauthorizedError } from '../../../app/apiError'
import { logout } from '../../auth/authSlice'
import { baseApi } from '../../../app/baseApi'
import { useAuth } from '../../auth/hooks/useAuth'
import { useGetFeedQuery, useDeletePostMutation, useToggleLikeMutation, type Post } from '../postsApi'
import { useOwnProfile } from '../../users/hooks/useOwnProfile'
import { useGetStoryFeedQuery } from '../../stories/storiesApi'

const FIRST_PAGE = 1

type PageChunk = { page: number; posts: Post[]; nextPage: number | null }

// useFeed – all data + interaction logic for the friends-only posts feed,
// no JSX: page-chunk collection, optimistic like toggles, comment-count
// patches, post-created reset, own identity + stories tray data.
export function useFeed() {
  const { isAuthenticated } = useAuth()
  const dispatch = useAppDispatch()
  const [page, setPage] = useState(FIRST_PAGE)
  const [chunks, setChunks] = useState<PageChunk[]>([])
  const [likePending, setLikePending] = useState<Set<string>>(new Set())
  const [toggleLike] = useToggleLikeMutation()
  const [deletePost] = useDeletePostMutation()
  const { data, isLoading, isFetching, error } = useGetFeedQuery(page === FIRST_PAGE ? undefined : { page }, {
    skip: !isAuthenticated,
  })
  // Own identity paints instantly from localStorage cache, reconciled by getMe.
  const { me, username: ownUsername, avatarUrl: ownAvatarUrl } = useOwnProfile()
  const { data: storyGroups, isLoading: storiesLoading } = useGetStoryFeedQuery(undefined, {
    skip: !isAuthenticated,
  })

  // Stale session (cookie gone but local mirror true): first 401 logs out,
  // ProtectedLayout redirects on re-render — replaces the page-level guard.
  useEffect(() => {
    if (isUnauthorizedError(error)) dispatch(logout())
  }, [error, dispatch])

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

  const patchPost = useCallback((postId: string, patch: (post: Post) => Post) => {
    setChunks((prev) =>
      prev.map((chunk) => ({
        ...chunk,
        posts: chunk.posts.map((post) => (post.id === postId ? patch(post) : post)),
      })),
    )
  }, [])

  // Optimistic like toggle: flip instantly, reconcile with the
  // authoritative server response, revert on failure.
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

  // Comment created: bump the cached count so the toggle label stays in
  // sync (same local-patch pattern as likes — no 'Post' invalidation).
  const handleCommentAdded = useCallback(
    (postId: string) => {
      patchPost(postId, (post) => ({ ...post, commentsCount: (post.commentsCount ?? 0) + 1 }))
    },
    [patchPost],
  )

  // Comment deleted: decrement the cached count, floored at 0.
  const handleCommentDeleted = useCallback(
    (postId: string) => {
      patchPost(postId, (post) => ({ ...post, commentsCount: Math.max(0, (post.commentsCount ?? 1) - 1) }))
    },
    [patchPost],
  )

  const handleCreated = useCallback(() => {
    // New post belongs on top of page 1 – drop collected pages and reload fresh.
    setChunks([])
    setPage(FIRST_PAGE)
    dispatch(baseApi.util.resetApiState())
  }, [dispatch])

  // Post deleted: drop it from collected chunks optimistically, revert on failure.
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
  }
}
