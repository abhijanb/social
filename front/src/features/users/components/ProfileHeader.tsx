import { Link } from 'react-router-dom'
import Avatar from '../../../components/Avatar'
import type { Profile, ProfileRelation, User } from '../usersApi'

// ProfileHeader – dumb header for /u/:username: avatar, username,
// badges, stats, relation actions, bio. Data comes from useProfilePage.
export default function ProfileHeader({
  user,
  stats,
  relation,
  onEdit,
}: {
  user: User
  stats: Profile['stats'] | undefined
  relation: ProfileRelation | null
  onEdit: () => void
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900">
      <div className="flex items-start gap-5">
        <div className="rounded-full bg-gradient-to-tr from-[#aa3bff] via-fuchsia-500 to-amber-400 p-0.5">
          <div className="rounded-full bg-white p-0.5 dark:bg-zinc-900">
            <Avatar username={user.username} avatarUrl={user.avatarUrl} size="xl" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-bold text-gray-900 dark:text-white">{user.username}</h1>
            {!user.isPublic && (
              <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold text-gray-500 dark:bg-zinc-800 dark:text-zinc-400">
                Private
              </span>
            )}
          </div>
          {user.displayName && (
            <p className="mt-0.5 truncate text-sm font-medium text-gray-700 dark:text-zinc-200">{user.displayName}</p>
          )}
          <div className="mt-3 flex gap-5 text-sm">
            <span className="text-gray-600 dark:text-zinc-300">
              <strong className="font-bold text-gray-900 dark:text-white">{stats?.posts ?? '…'}</strong> posts
            </span>
            <span className="text-gray-600 dark:text-zinc-300">
              <strong className="font-bold text-gray-900 dark:text-white">{stats?.friends ?? '…'}</strong> friends
            </span>
            <span className="text-gray-600 dark:text-zinc-300">
              <strong className="font-bold text-gray-900 dark:text-white">{stats?.storiesActive ?? '…'}</strong> stories
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {relation?.isSelf ? (
              <>
                <button
                  onClick={onEdit}
                  className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Edit profile
                </button>
                <Link
                  to="/saved"
                  className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Saved
                </Link>
              </>
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
      {user.bio && (
        <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-800 dark:text-zinc-100">
          {user.bio}
        </p>
      )}
    </div>
  )
}
