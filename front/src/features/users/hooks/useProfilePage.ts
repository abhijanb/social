import { useCallback, useState } from 'react'
import { useAppDispatch } from '../../../app/hooks'
import { logout } from '../../auth/authSlice'
import { useAuth } from '../../auth/hooks/useAuth'
import { useDeletePostMutation, useGetUserPostsQuery, type Post } from '../../posts/postsApi'
import { useGetProfileQuery } from '../usersApi'
import { useOwnProfile } from './useOwnProfile'

export function isUnauthorizedError(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 401
}

export function isNotFoundError(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 404
}

export function isForbiddenError(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 403
}

// useProfilePage – all data + pagination logic for /u/:username, no JSX:
// auth + 401 handling, profile query, own-page fast-path header (instant
// localStorage-backed identity while getProfile loads), friends-only posts
// query with page-chunk collection (same pattern as useFeed).
export function useProfilePage(username: string) {
  const { isAuthenticated } = useAuth()
  const dispatch = useAppDispatch()
  const [editing, setEditing] = useState(false)
  const [page, setPage] = useState(1)
  const [chunks, setChunks] = useState<{ page: number; posts: Post[] }[]>([])
  const [prevUsername, setPrevUsername] = useState(username)
  const [deletePost] = useDeletePostMutation()

  // Reset pagination when switching profiles (render-time guard, same as useFeed).
  if (prevUsername !== username) {
    setPrevUsername(username)
    setPage(1)
    setChunks([])
  }

  const {
    data: profile,
    error: profileError,
    isLoading: profileLoading,
  } = useGetProfileQuery(username, { skip: !isAuthenticated || !username })

  // Own-page fast path: header paints instantly from the localStorage-backed
  // own identity while getProfile (stats/relation) still loads.
  const { me: ownUser, username: ownUsername } = useOwnProfile()
  const isOwnPage = ownUsername !== '' && ownUsername.toLowerCase() === username.toLowerCase()
  const headerUser = profile?.user ?? (isOwnPage ? (ownUser ?? null) : null)
  const relation = profile?.relation ?? (isOwnPage ? { isSelf: true, isFriend: false, pending: false, canViewPosts: true } : null)

  const authorId = profile?.user.id ?? (isOwnPage ? ownUser?.id : undefined)
  const canView = profile ? profile.relation.canViewPosts : isOwnPage
  const {
    data: postsData,
    error: postsError,
    isLoading: postsLoading,
    isFetching: postsFetching,
  } = useGetUserPostsQuery(authorId ? { authorId, page } : { authorId: '', page }, {
    skip: !isAuthenticated || !authorId || !canView,
  })

  if (isUnauthorizedError(profileError)) {
    dispatch(logout())
  }

  // Each page cached separately by RTK Query; collect here (same pattern as useFeed).
  if (postsData && !chunks.some((c) => c.page === page)) {
    setChunks([...chunks, { page, posts: postsData.posts }])
  }
  const posts = chunks.flatMap((c) => c.posts)
  // Show current page data immediately while chunks catch up.
  const visiblePosts = posts.length > 0 ? posts : (postsData?.posts ?? [])
  const nextPage = postsData?.nextPage ?? null

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
    username,
    isAuthenticated,
    profile,
    profileError,
    profileLoading,
    headerUser,
    relation,
    canView,
    posts,
    visiblePosts,
    nextPage,
    postsError,
    postsLoading,
    postsFetching,
    editing,
    setEditing,
    setPage,
    handleDeleted,
  }
}
