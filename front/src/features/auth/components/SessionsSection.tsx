import type { Session } from '../authApi'
import { useSessionsView } from '../hooks/useSessionsView'
import SessionRow from './SessionRow'

// SessionsSection – dumb "Active sessions" card for /settings.
// Display state comes from useSessionsView; data + actions are props
// wired by the page from useSessions.
export default function SessionsSection({
  sessions,
  isLoading,
  isLoggingOutOthers,
  actionError,
  onLogoutOthers,
  onRevoke,
}: {
  sessions: Session[]
  isLoading: boolean
  isLoggingOutOthers: boolean
  actionError: unknown
  onLogoutOthers: () => void
  onRevoke: (id: string) => void
}) {
  const { activeSessions, otherCount, isEmpty, describeSession, formatLastSeen } =
    useSessionsView(sessions)

  return (
    <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Active sessions</h2>
          <p className="mt-1 max-w-md text-sm text-gray-500 dark:text-zinc-400">
            {isLoading
              ? 'Checking your devices…'
              : isEmpty
                ? 'No active sessions.'
                : `${activeSessions.length} active session${activeSessions.length === 1 ? '' : 's'} — revoke any device you don't recognize.`}
          </p>
        </div>
        {otherCount > 0 && (
          <button
            type="button"
            onClick={onLogoutOthers}
            disabled={isLoggingOutOthers}
            className="shrink-0 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isLoggingOutOthers ? 'Logging out…' : 'Logout other devices'}
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="mt-4 text-sm text-gray-500 dark:text-zinc-400">Loading sessions…</p>
      ) : (
        <ul className="mt-4 divide-y divide-gray-100 dark:divide-zinc-700">
          {activeSessions.map((session) => (
            <SessionRow
              key={session.id}
              session={session}
              label={describeSession(session)}
              lastSeen={formatLastSeen(session.lastSeenAt)}
              onRevoke={onRevoke}
            />
          ))}
        </ul>
      )}
      {actionError ? (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">Action failed — please try again</p>
      ) : null}
    </div>
  )
}
