import { useParams } from 'react-router-dom'
import EditProfileModal from '../features/users/components/EditProfileModal'
import ProfileHeader from '../features/users/components/ProfileHeader'
import ProfilePostsGrid from '../features/users/components/ProfilePostsGrid'
import ProfileHeaderSkeleton from '../features/users/components/ProfileHeaderSkeleton'
import ProfileNotFound from '../features/users/components/ProfileNotFound'
import { useProfilePage } from '../features/users/hooks/useProfilePage'

// ProfilePage – thin shell for /u/:username: header + posts grid.
// Auth is gated by ProtectedLayout; stale sessions log out via useProfilePage.
// Data + pagination live in useProfilePage, JSX in features/users/components.
export default function ProfilePage() {
  const { username = '' } = useParams<{ username: string }>()
  const {
    profile,
    profileError,
    profileLoading,
    headerUser,
    relation,
    canView,
    visiblePosts,
    nextPage,
    postsError,
    postsLoading,
    postsFetching,
    editing,
    setEditing,
    setPage,
  } = useProfilePage(username)

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 px-4 py-6 dark:bg-[#16171d]">
      <div className="mx-auto max-w-2xl">
        {!headerUser && profileLoading ? (
          <ProfileHeaderSkeleton />
        ) : !headerUser ? (
          <ProfileNotFound username={username} error={profileError} />
        ) : (
          <>
            <ProfileHeader
              user={headerUser}
              stats={profile?.stats}
              relation={relation}
              onEdit={() => setEditing(true)}
            />

            <ProfilePostsGrid
              posts={visiblePosts}
              nextPage={nextPage}
              postsLoading={postsLoading}
              postsFetching={postsFetching}
              postsError={postsError}
              canView={canView}
              profileLoading={profileLoading}
              hasProfile={!!profile}
              onLoadMore={setPage}
            />

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
