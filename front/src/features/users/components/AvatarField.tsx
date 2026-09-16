import Avatar from '../../../components/Avatar'
import { ACCEPT_AVATAR } from '../hooks/useEditProfile'

// AvatarField – dumb avatar picker for EditProfileModal: preview /
// initials / current photo + change / remove / undo + errors. No hooks here.
export default function AvatarField({
  username,
  preview,
  previewSrc,
  removeAvatar,
  pickError,
  onPick,
  onRemove,
  onUndoRemove,
}: {
  username: string
  preview: string | null
  previewSrc: string | null
  removeAvatar: boolean
  pickError: string | null
  onPick: (files: FileList | undefined) => void
  onRemove: () => void
  onUndoRemove: () => void
}) {
  return (
    <>
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
                onPick(e.target.files ?? undefined)
                e.target.value = ''
              }}
            />
          </label>
          {(preview || (!removeAvatar && previewSrc)) && (
            <button
              onClick={onRemove}
              className="rounded-full border border-gray-300 px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Remove
            </button>
          )}
          {removeAvatar && !preview && (
            <button
              onClick={onUndoRemove}
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
    </>
  )
}
