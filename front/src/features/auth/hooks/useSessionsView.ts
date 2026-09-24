import type { Session } from '../authApi'

// Short human label for a session row — browser/OS guess from the UA,
// falling back to IP or a bare date.
export function describeSession(session: Session): string {
  const ua = session.userAgent ?? ''
  const browser = /firefox/i.test(ua)
    ? 'Firefox'
    : /edg/i.test(ua)
      ? 'Edge'
      : /chrome/i.test(ua)
        ? 'Chrome'
        : /safari/i.test(ua)
          ? 'Safari'
          : null
  const os = /windows/i.test(ua)
    ? 'Windows'
    : /mac os/i.test(ua)
      ? 'macOS'
      : /android/i.test(ua)
        ? 'Android'
        : /iphone|ipad/i.test(ua)
          ? 'iOS'
          : /linux/i.test(ua)
            ? 'Linux'
            : null
  const device = [browser, os].filter(Boolean).join(' on ')
  if (device) return device
  if (session.ip) return `IP ${session.ip}`
  return `Created ${new Date(session.createdAt).toLocaleDateString()}`
}

export function formatLastSeen(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60 * 1000) return 'just now'
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

// useSessionsView – pure view-model for the Settings sessions card.
// No fetching here (see useSessions); derives display state from rows.
export function useSessionsView(sessions: Session[]) {
  const activeSessions = sessions.filter((s) => !s.revokedAt)
  const otherCount = activeSessions.filter((s) => !s.current).length

  return {
    activeSessions,
    otherCount,
    isEmpty: activeSessions.length === 0,
    describeSession,
    formatLastSeen,
  }
}
