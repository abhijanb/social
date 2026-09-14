import { Navigate } from 'react-router-dom'
import { useAuth } from '../features/auth/hooks/useAuth'
import { useGetMeQuery, useUpdateUserMutation } from '../features/users/usersApi'
import { useAppDispatch } from '../app/hooks'
import { logout } from '../features/auth/authSlice'
import { useEffect } from 'react'

function isUnauthorizedError(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 401
}

export default function SettingsPage() {
  const { isAuthenticated } = useAuth()
  const dispatch = useAppDispatch()
  const { data: me, isLoading, error } = useGetMeQuery(undefined, { skip: !isAuthenticated })
  const [updateUser, { isLoading: isSaving, error: saveError }] = useUpdateUserMutation()

  useEffect(() => {
    if (isUnauthorizedError(error)) dispatch(logout())
  }, [error, dispatch])

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (isUnauthorizedError(error)) return <Navigate to="/login" replace />

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gray-50 dark:bg-[#16171d]">
        <p className="text-sm text-gray-500 dark:text-zinc-400">Loading settings...</p>
      </div>
    )
  }

  if (error && !isUnauthorizedError(error)) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gray-50 px-4 dark:bg-[#16171d]">
        <p className="text-sm text-red-600 dark:text-red-400">Failed to load settings</p>
      </div>
    )
  }

  const isPublic = me?.isPublic ?? true

  const handleToggle = async () => {
    try {
      await updateUser({ patch: { isPublic: !isPublic } }).unwrap()
    } catch {
      // error handled via saveError
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 px-4 py-8 dark:bg-[#16171d]">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Settings</h1>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Profile visibility</h2>
              <p className="mt-1 max-w-md text-sm text-gray-500 dark:text-zinc-400">
                {isPublic
                  ? 'Your profile is public and appears in username search for everyone.'
                  : 'Your profile is private and hidden from search. Only existing friends can still interact with you.'}
              </p>
              {!isPublic && (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">Private accounts don&apos;t appear in search.</p>
              )}
            </div>
            <button
              role="switch"
              aria-checked={isPublic}
              aria-label="Toggle profile visibility"
              onClick={handleToggle}
              disabled={isSaving}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:opacity-50 ${isPublic ? 'bg-violet-600' : 'bg-gray-200 dark:bg-zinc-700'}`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${isPublic ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>
          <div className="mt-4 flex items-center gap-3 text-sm">
            <span className={`font-medium ${isPublic ? 'text-violet-600 dark:text-violet-400' : 'text-gray-500 dark:text-zinc-400'}`}>
              {isPublic ? 'Public' : 'Private'}
            </span>
            {isSaving && <span className="text-gray-500 dark:text-zinc-400">Saving...</span>}
          </div>
          {saveError && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">Failed to save settings</p>
          )}
        </div>
      </div>
    </div>
  )
}
