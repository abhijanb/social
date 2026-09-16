import Avatar from '../../../components/Avatar'
import { isUnauthorizedError } from '../../../app/apiError'
import { ACCEPT_AVATAR, useEditProfile } from '../../users/hooks/useEditProfile'

// EditProfileModal – edit bio + display name + avatar (username stays stable
// so /u/:username links never break mid-session). Form + avatar logic live
// in useEditProfile; this file is props + JSX only.
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

        <div className="mb-3 flex items-center gap-3">
          {preview ? (
            <img
              src={preview}
              alt="New avatar preview"
              className="h-16 w-16 shrink-0 rounded-full bg-gray-100 object-cover dark:bg-zinc-800"
            />
          ) : removeAvatar || !previewSrc ? (
            <Avatar username={username} avatarUrl={null} size="xl" className="!h-16 !w-16" />
          ) : (
            <img
              src={previewSrc}
              alt={`${username}'s avatar`}
              className="h-16 w-16 shrink-0 rounded-full bg-gray-100 object-cover dark:bg-zinc-800"
            />
          )}
          <div className="flex flex-col gap-1.5">
            <label className="cursor-pointer rounded-full bg-violet-600 px-4 py-1.5 text-center text-xs font-semibold text-white transition hover:bg-violet-700">
              {previewSrc || preview ? 'Change photo' : 'Upload photo'}
              <input
                type="file"
                accept={ACCEPT_AVATAR}
                className="hidden"
                onChange={(e) => {
                  handlePick(e.target.files ?? undefined)
                  e.target.value = ''
                }}
              />
            </label>
            {(preview || (!removeAvatar && previewSrc)) && (
              <button
                onClick={handleRemove}
                className="rounded-full border border-gray-300 px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Remove
              </button>
            )}
            {removeAvatar && !preview && (
              <button
                onClick={handleUndoRemove}
                className="text-xs font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400"
              >
                Undo remove
              </button>
            )}
          </div>
        </div>
        {removeAvatar && !preview && (
          <p className="mb-2 text-xs text-gray-500 dark:text-zinc-400">Avatar will be removed (back to initials).</p>
        )}
        {pickError && <p className="mb-2 text-xs text-red-600 dark:text-red-400">{pickError}</p>}

        <label className="block text-xs font-medium text-gray-600 dark:text-zinc-300">
          Display name
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={60}
            placeholder="Your name"
            className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-violet-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          />
        </label>
        <p className={`mt-1 text-right text-[11px] tabular-nums ${nameOver ? 'text-red-600' : 'text-gray-400'}`}>
          {displayName.trim().length}/50
        </p>

        <label className="mt-2 block text-xs font-medium text-gray-600 dark:text-zinc-300">
          Bio
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={170}
            placeholder="Tell people about you…"
            className="mt-1 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-violet-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          />
        </label>
        <p className={`mt-1 text-right text-[11px] tabular-nums ${bioOver ? 'text-red-600' : 'text-gray-400'}`}>
          {bio.trim().length}/150
        </p>

        {error && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">
            {isUnauthorizedError(error) ? 'Session expired, please login again' : 'Failed to save profile'}
          </p>
        )}

        <div className="mt-3 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-full px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="rounded-full bg-gradient-to-r from-violet-600 to-[#aa3bff] px-5 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLoading ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
