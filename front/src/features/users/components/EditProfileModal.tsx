import { useEditProfile } from '../../users/hooks/useEditProfile'
import AvatarField from './AvatarField'
import EditProfileFooter from './EditProfileFooter'
import ProfileFields from './ProfileFields'

// EditProfileModal – edit bio + display name + avatar (username stays stable
// so /u/:username links never break mid-session). Form + avatar logic live
// in useEditProfile; sections live in sibling components.
export default function EditProfileModal({
  username,
  initialBio,
  initialDisplayName,
  initialAvatarUrl,
  onClose,
}: {
  username: string
  initialBio: string
  initialDisplayName: string | null
  initialAvatarUrl: string | null
  onClose: () => void
}) {
  const {
    bio,
    setBio,
    displayName,
    setDisplayName,
    preview,
    previewSrc,
    removeAvatar,
    pickError,
    isLoading,
    error,
    bioOver,
    nameOver,
    canSave,
    handlePick,
    handleRemove,
    handleUndoRemove,
    handleSave,
  } = useEditProfile({ initialBio, initialDisplayName, initialAvatarUrl, onClose })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Edit profile</h2>
          <button
            onClick={onClose}
            aria-label="Close edit profile"
            className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <AvatarField
          username={username}
          preview={preview}
          previewSrc={previewSrc}
          removeAvatar={removeAvatar}
          pickError={pickError}
          onPick={handlePick}
          onRemove={handleRemove}
          onUndoRemove={handleUndoRemove}
        />

        <ProfileFields
          displayName={displayName}
          setDisplayName={setDisplayName}
          nameOver={nameOver}
          bio={bio}
          setBio={setBio}
          bioOver={bioOver}
        />

        <EditProfileFooter
          error={error}
          isLoading={isLoading}
          canSave={canSave}
          onClose={onClose}
          onSave={handleSave}
        />      </div>
    </div>
  )
}
