import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useAppDispatch } from '../app/hooks'
import { useAuth } from '../features/auth/hooks/useAuth'
import { logout } from '../features/auth/authSlice'
import { useGetProfileQuery } from '../features/users/usersApi'
import { useGetUserPostsQuery, type Post } from '../features/posts/postsApi'
import { resolveImageUrl } from '../features/posts/resolvePostImage'
import EditProfileModal from '../features/users/components/EditProfileModal'

function isUnauthorizedError(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 401
}

function isNotFoundError(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 404
}

function isForbiddenError(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 403
}

function FirstTile({ post }: { post: Post }) {
  const first = [...(post.images ?? [])].sort((a, b) => a.order - b.order)[0]
  const src = resolveImageUrl(first?.url)
  if (src) {
    return (
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-zinc-800">
        {first.kind === 'VIDEO' ? (
          <>
            <video src={src} muted preload="metadata" playsInline className="h-full w-full object-cover" />
            <span className="absolute right-1.5 top-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              VIDEO
            </span>
          </>
        ) : (
          <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
        )}
      </div>
    )
  }
  return (
    <div className="flex aspect-square items-center justify-center overflow-hidden bg-gray-100 p-3 text-center dark:bg-zinc-800">
      <p className="line-clamp-4 text-xs leading-relaxed text-gray-700 dark:text-zinc-200">{post.text}</p>
    </div>
  )
}

// ProfilePage – Instagram-style /u/:username: header (avatar, display name,
// bio, stats), relation-aware actions, friends-only posts grid.
export default function ProfilePage() {
  const { username = '' } = useParams<{ username: string }>()
  const { isAuthenticated } = useAuth()
  const dispatch = useAppDispatch()
  const [editing, setEditing] = useState(false)
  const [page, setPage] = useState(1)
  const [chunks, setChunks] = useState<{ page: number; posts: Post[] }[]>([])
  const [prevUsername, setPrevUsername] = useState(username)

  // Reset pagination when switching profiles (render-time guard, same as FeedPage).
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

  const authorId = profile?.user.id
  const canView = profile?.relation.canViewPosts ?? false
  const {
    data: postsData,
    error: postsError,
    isLoading: postsLoading,
    isFetching: postsFetching,
  } = useGetUserPostsQuery(authorId ? { authorId, page } : { authorId: '', page }, {
    skip: !isAuthenticated || !authorId || !canView,
  })

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (isUnauthorizedError(profileError)) {
    dispatch(logout())
    return <Navigate to="/login" replace />
  }

  // Each page cached separately by RTK Query; collect here (same pattern as FeedPage).
  if (postsData && !chunks.some((c) => c.page === page)) {
    setChunks([...chunks, { page, posts: postsData.posts }])
  }
  const posts = chunks.flatMap((c) => c.posts)
  // Show current page data immediately while chunks catch up.
  const visiblePosts = posts.length > 0 ? posts : (postsData?.posts ?? [])
  const nextPage = postsData?.nextPage ?? null

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 px-4 py-6 dark:bg-[#16171d]">
      <div className="mx-auto max-w-2xl">
        {profileLoading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-zinc-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
                <div className="h-3 w-64 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
              </div>
            </div>
          </div>
        ) : profileError || !profile ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
            {isNotFoundError(profileError) ? (
              <>
                <p className="text-lg font-bold text-gray-900 dark:text-white">User not found</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
                  No account named “{username}”.
                </p>
                <Link
                  to="/search"
                  className="mt-4 inline-block rounded-full bg-violet-600 px-5 py-1.5 text-sm font-semibold text-white hover:bg-violet-700"
                >
                  Search users
                </Link>
              </>
            ) : (
              <p className="text-sm text-red-600 dark:text-red-400">Failed to load profile</p>
            )}
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900">
              <div className="flex items-start gap-5">
                <div className="rounded-full bg-gradient-to-tr from-[#aa3bff] via-fuchsia-500 to-amber-400 p-0.5">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-2xl font-bold text-gray-900 dark:bg-zinc-900 dark:text-white">
                    {profile.user.username.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="truncate text-xl font-bold text-gray-900 dark:text-white">
                      {profile.user.username}
                    </h1>
                    {!profile.user.isPublic && (
                      <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold text-gray-500 dark:bg-zinc-800 dark:text-zinc-400">
                        Private
                      </span>
                    )}
                  </div>
                  {profile.user.displayName && (
                    <p className="mt-0.5 truncate text-sm font-medium text-gray-700 dark:text-zinc-200">
                      {profile.user.displayName}
                    </p>
                  )}
                  <div className="mt-3 flex gap-5 text-sm">
                    <span className="text-gray-600 dark:text-zinc-300">
                      <strong className="font-bold text-gray-900 dark:text-white">{profile.stats.posts}</strong> posts
                    </span>
                    <span className="text-gray-600 dark:text-zinc-300">
                      <strong className="font-bold text-gray-900 dark:text-white">{profile.stats.friends}</strong> friends
                    </span>
                    <span className="text-gray-600 dark:text-zinc-300">
                      <strong className="font-bold text-gray-900 dark:text-white">{profile.stats.storiesActive}</strong> stories
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {profile.relation.isSelf ? (
                      <button
                        onClick={() => setEditing(true)}
                        className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
                      >
                        Edit profile
                      </button>
                    ) : profile.relation.isFriend ? (
                      <>
                        <span className="rounded-full bg-green-100 px-4 py-1.5 text-sm font-semibold text-green-700 dark:bg-green-500/15 dark:text-green-300">
                          Friends
                        </span>
                        <Link
                          to="/chat"
                          className="rounded-full bg-violet-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-violet-700"
                        >
                          Message
                        </Link>
                      </>
                    ) : profile.relation.pending ? (
                      <span className="rounded-full bg-gray-100 px-4 py-1.5 text-sm font-semibold text-gray-600 dark:bg-zinc-800 dark:text-zinc-300">
                        Request pending
                      </span>
                    ) : (
                      <Link
                        to="/search"
                        className="rounded-full bg-violet-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-violet-700"
                      >
                        Find friends
                      </Link>
                    )}
                  </div>
                </div>
              </div>
              {profile.user.bio && (
                <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-800 dark:text-zinc-100">
                  {profile.user.bio}
                </p>
              )}
            </div>

            <div className="mt-4">
              {!canView ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">This account is private</p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
                    Become friends to see their posts.
                  </p>
                </div>
              ) : postsLoading && visiblePosts.length === 0 ? (
                <div className="grid grid-cols-3 gap-1">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="aspect-square animate-pulse bg-gray-200 dark:bg-zinc-800" />
                  ))}
                </div>
              ) : postsError && !isForbiddenError(postsError) ? (
                <p className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-red-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-red-400">
                  Failed to load posts
                </p>
              ) : posts.length === 0 && visiblePosts.length === 0 ? (
                <p className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
                  No posts yet.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-1 overflow-hidden rounded-xl">
                    {visiblePosts.map((p) => (
                      <FirstTile key={p.id} post={p} />
                    ))}
                  </div>
                  {nextPage !== null && (
                    <button
                      onClick={() => setPage(nextPage)}
                      disabled={postsFetching}
                      className="mx-auto mt-4 block rounded-full border border-gray-300 px-5 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      {postsFetching ? 'Loading…' : 'Load more'}
                    </button>
                  )}
                </>
              )}
            </div>

            {editing && (
              <EditProfileModal
                initialBio={profile.user.bio ?? ''}
                initialDisplayName={profile.user.displayName ?? null}
                onClose={() => setEditing(false)}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
