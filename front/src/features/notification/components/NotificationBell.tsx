import { useEffect, useRef, useState } from 'react'
import { BellIcon } from '../../../components/NavbarIcons'
import ActionErrorBanner from '../../../components/ActionErrorBanner'
import { notificationActionErrorMessage } from './notificationActionError'
import { useNotifications } from '../hooks/useNotifications'
import type { NotificationType } from '../types'

// Short human label per notification type for the dropdown rows.
const TYPE_LABELS: Record<NotificationType, string> = {
  FRIEND_REQUEST: 'Friend request',
  FRIEND_ACCEPTED: 'Friend accepted',
  POST_LIKE: 'Post like',
  POST_COMMENT: 'Post comment',
  STORY_VIEW: 'Story view',
  LIVESTREAM_COMMENT: 'Livestream comment',
}

// NotificationBell – navbar bell with unread badge + dropdown panel, no page.
// List data is lazy: fetched on first open, not on page load.
export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    actionError,
    isMarkingRead,
    isDeleting,
    isMarkingAllRead,
    ensureList,
    markRead,
    markAllRead,
    remove,
  } = useNotifications()

  // Fetch the list on first open (no-op while subscribed).
  useEffect(() => {
    if (open) ensureList()
  }, [open, ensureList])

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open ])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-expanded={open}
        title="Notifications"
        className="relative rounded-full p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#aa3bff] px-1 text-[11px] font-semibold text-white dark:bg-violet-600">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 max-h-96 w-80 overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-zinc-800">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Notifications</h2>
            {unreadCount > 0 && (
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                {unreadCount} new
              </span>
            )}
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                disabled={isMarkingAllRead}
                className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 transition hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-violet-500/15 dark:text-violet-300 dark:hover:bg-violet-500/25"
              >
                {isMarkingAllRead ? 'Marking...' : 'Mark all as read'}
              </button>
            )}
          </div>

          <ActionErrorBanner
            error={actionError}
            getMessage={notificationActionErrorMessage}
            className="px-4 pt-2 text-center text-sm text-red-600 dark:text-red-400"
          />

          {isLoading ? (
            <p className="px-4 py-6 text-center text-sm text-gray-500 dark:text-zinc-400">Loading...</p>
          ) : error ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-gray-500 dark:text-zinc-400">Couldn&apos;t load notifications.</p>
              <button
                type="button"
                onClick={() => ensureList()}
                className="mt-2 rounded-full px-3 py-1 text-sm font-medium text-violet-700 hover:bg-violet-100 dark:text-violet-300 dark:hover:bg-violet-500/15"
              >
                Retry
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-500 dark:text-zinc-400">
              No notifications yet.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-zinc-800">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`flex items-start gap-2 px-4 py-3 ${
                    n.isRead ? '' : 'bg-violet-50/60 dark:bg-violet-500/5'
                  }`}
                >
                  <button
                    type="button"
                    disabled={n.isRead || isMarkingRead}
                    onClick={() => {
                      if (!n.isRead) void markRead(n.id)
                    }}
                    title={n.isRead ? undefined : 'Mark as read'}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-violet-700 dark:text-violet-300">
                      {TYPE_LABELS[n.type]}
                    </p>
                    <p className="mt-0.5 break-words text-sm text-gray-800 dark:text-zinc-100">
                      {n.content}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400 dark:text-zinc-500">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => void remove(n.id)}
                    aria-label="Delete notification"
                    title="Delete"
                    className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
