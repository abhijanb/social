import { Link, Navigate, useParams } from 'react-router-dom'
import type { Post } from '../features/posts/postsApi'
import { resolveImageUrl } from '../features/posts/resolvePostImage'
import Avatar from '../components/Avatar'
import EditProfileModal from '../features/users/components/EditProfileModal'
import {
  isForbiddenError,
  isNotFoundError,
  isUnauthorizedError,
  useProfilePage,
} from '../features/users/hooks/useProfilePage'

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
// Data + pagination live in useProfilePage; this file is JSX only.
export default function ProfilePage() {
  const { username = '' } = useParams<{ username: string }>()
  const {
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
  } = useProfilePage(username)

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (isUnauthorizedError(profileError)) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 px-4 py-6 dark:bg-[#16171d]">
      <div className="mx-auto max-w-2xl">
        {!headerUser && profileLoading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-zinc-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
                <div className="h-3 w-64 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
              </div>
            </div>
          </div>
        ) : !headerUser ? (
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
                  <div className="rounded-full bg-white p-0.5 dark:bg-zinc-900">
                    <Avatar username={headerUser.username} avatarUrl={headerUser.avatarUrl} size="xl" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="truncate text-xl font-bold text-gray-900 dark:text-white">
                      {headerUser.username}
                    </h1>
                    {!headerUser.isPublic && (
                      <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold text-gray-500 dark:bg-zinc-800 dark:text-zinc-400">
                        Private
                      </span>
                    )}
                  </div>
                  {headerUser.displayName && (
                    <p className="mt-0.5 truncate text-sm font-medium text-gray-700 dark:text-zinc-200">
                      {headerUser.displayName}
                    </p>
                  )}
                  <div className="mt-3 flex gap-5 text-sm">
                    <span className="text-gray-600 dark:text-zinc-300">
                      <strong className="font-bold text-gray-900 dark:text-white">{profile?.stats.posts ?? '…'}</strong> posts
                    </span>
                    <span className="text-gray-600 dark:text-zinc-300">
                      <strong className="font-bold text-gray-900 dark:text-white">{profile?.stats.friends ?? '…'}</strong> friends
                    </span>
                    <span className="text-gray-600 dark:text-zinc-300">
                      <strong className="font-bold text-gray-900 dark:text-white">{profile?.stats.storiesActive ?? '…'}</strong> stories
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {relation?.isSelf ? (
                      <button
                        onClick={() => setEditing(true)}
                        className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
                      >
                        Edit profile
                      </button>
                    ) : relation?.isFriend ? (
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
                    ) : relation?.pending ? (
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
              {headerUser.bio && (
                <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-800 dark:text-zinc-100">
                  {headerUser.bio}
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
              ) : (profileLoading && !profile) || (postsLoading && visiblePosts.length === 0) ? (
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
                username={headerUser.username}
                initialBio={headerUser.bio ?? ''}
                initialDisplayName={headerUser.displayName ?? null}
                initialAvatarUrl={headerUser.avatarUrl ?? null}
                onClose={() => setEditing(false)}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
