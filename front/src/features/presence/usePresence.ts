import { useEffect, useState, useMemo } from 'react'
import { useGetPresenceQuery } from './presenceApi'
import { getPresenceSocket, disconnectPresenceSocket } from './socket'
import type { PresenceInfo } from './presenceApi'
import { useAuth } from '../auth/hooks/useAuth'

function formatLastSeen(lastSeenAt: string | null): string | null {
  if (!lastSeenAt) return null
  const diff = Date.now() - new Date(lastSeenAt).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(lastSeenAt).toLocaleDateString()
}

export function usePresence(friendIds: string[]) {
  const { isAuthenticated } = useAuth()
  const idsParam = useMemo(() => friendIds.join(','), [friendIds])
  const shouldFetch = isAuthenticated && friendIds.length > 0

  const { data: initial } = useGetPresenceQuery(idsParam, { skip: !shouldFetch })

  const [presenceMap, setPresenceMap] = useState<Map<string, PresenceInfo>>(new Map())

  useEffect(() => {
    if (initial) {
      setPresenceMap((prev) => {
        const next = new Map(prev)
        for (const p of initial) next.set(p.userId, p)
        return next
      })
    }
  }, [initial])

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectPresenceSocket()
      setPresenceMap(new Map())
      return
    }
    if (friendIds.length === 0) return

    const socket = getPresenceSocket()

    const onUpdate = (info: PresenceInfo) => {
      if (!friendIds.includes(info.userId)) return
      setPresenceMap((prev) => {
        const next = new Map(prev)
        next.set(info.userId, info)
        return next
      })
    }

    socket.on('presence:update', onUpdate)

    // heartbeat every 25s
    const interval = setInterval(() => {
      if (socket.connected) socket.emit('presence:heartbeat')
    }, 25000)

    return () => {
      socket.off('presence:update', onUpdate)
      clearInterval(interval)
    }
  }, [isAuthenticated, friendIds])

  const isOnline = (userId: string) => presenceMap.get(userId)?.online ?? false
  const lastSeen = (userId: string) => {
    const info = presenceMap.get(userId)
    if (!info || info.online) return null
    return formatLastSeen(info.lastSeenAt)
  }

  return { presenceMap, isOnline, lastSeen }
}
