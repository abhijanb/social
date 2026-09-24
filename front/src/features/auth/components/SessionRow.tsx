import type { Session } from '../authApi'

// SessionRow – pure presentational row: label, last-seen, This-device
// badge or Revoke button. No hooks, no filtering here.
export default function SessionRow({
  session,
  label,
  lastSeen,
  onRevoke,
}: {
  session: Session
  label: string
  lastSeen: string
  onRevoke: (id: string) => void
}) {
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
          {label}
          {session.current && (
            <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-500/10 dark:text-green-300">
              This device
            </span>
          )}
        </p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">Last seen {lastSeen}</p>
      </div>
      {!session.current && (
        <button
          type="button"
          aria-label={`Revoke session ${label}`}
          onClick={() => onRevoke(session.id)}
          className="shrink-0 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          Revoke
        </button>
      )}
    </li>
  )
}
