import { SettingsError, SettingsLoading } from '../features/users/components/SettingsLoadingError'
import VisibilityToggle from '../features/users/components/VisibilityToggle'
import { useSettings } from '../features/users/hooks/useSettings'
import SessionsSection from '../features/auth/components/SessionsSection'
import { useSessions } from '../features/auth/hooks/useSessions'
import { isUnauthorizedError } from '../app/apiError'

// SettingsPage – thin shell for /settings: states + toggle card + email verify + sessions.
// Auth is gated by ProtectedLayout; stale sessions log out via useSettings.
export default function SettingsPage() {
  const { isLoading, error, isPublic, emailVerified, username, isSaving, saveError, handleToggle, resendVerification, isResending } = useSettings()
  const { sessions, isLoading: sessionsLoading, handleLogoutOthers, isLoggingOutOthers, logoutAllError, handleRevoke, revokeError } = useSessions()

  if (isLoading) return <SettingsLoading />
  if (error && !isUnauthorizedError(error)) return <SettingsError />

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 px-4 py-8 dark:bg-[#16171d]">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Settings</h1>
        <VisibilityToggle isPublic={isPublic} isSaving={isSaving} isLoading={isLoading} saveError={saveError} onToggle={handleToggle} />
        <SessionsSection
          sessions={sessions}
          isLoading={sessionsLoading}
          isLoggingOutOthers={isLoggingOutOthers}
          actionError={logoutAllError ?? revokeError}
          onLogoutOthers={() => void handleLogoutOthers()}
          onRevoke={(id) => void handleRevoke(id)}
        />
        {!emailVerified && (
          <div className="mt-4 rounded-lg border border-yellow-500/50 bg-yellow-50 p-4 dark:border-yellow-500/30 dark:bg-yellow-500/10">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">Email not verified</p>
            <button
              type="button"
              disabled={isResending}
                  onClick={() => resendVerification({ username }).unwrap().catch(console.error)}
              className="mt-2 rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600 disabled:opacity-50"
            >
              {isResending ? 'Sending...' : 'Resend verification email'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
