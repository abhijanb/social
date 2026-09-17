import { isUnauthorizedError } from '../../../app/apiError'

// EditProfileFooter – dumb error + Cancel/Save for EditProfileModal. No hooks here.
export default function EditProfileFooter({
  error,
  isLoading,
  canSave,
  onClose,
  onSave,
}: {
  error: unknown
  isLoading: boolean
  canSave: boolean
  onClose: () => void
  onSave: () => void
}) {
  return (
    <>
      {error ? (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">
          {isUnauthorizedError(error) ? 'Session expired, please login again' : 'Failed to save profile'}
        </p>
      ) : null}

      <div className="mt-3 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-full px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={!canSave}
          className="rounded-full bg-gradient-to-r from-violet-600 to-[#aa3bff] px-5 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLoading ? 'Saving…' : 'Save'}
        </button>
      </div>
    </>
  )
}
