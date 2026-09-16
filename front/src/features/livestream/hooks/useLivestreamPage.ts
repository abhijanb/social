import { useState } from 'react'
import { useAuth } from '../../auth/hooks/useAuth'
import { useGetMeQuery } from '../../users/usersApi'
import { useGetLiveStreamsQuery } from '../livestreamApi'

// useLivestreamPage – all data + selection logic for /live, no JSX:
// auth, own identity, live list (15s poll), active stream derivation.
export function useLivestreamPage() {
  const { isAuthenticated } = useAuth()
  const [activeId, setActiveId] = useState<string | null>(null)

  const { data: me, error: meError } = useGetMeQuery(undefined, { skip: !isAuthenticated })
  const {
    data: streams = [],
    isLoading,
    error: streamsError,
  } = useGetLiveStreamsQuery(undefined, {
    skip: !isAuthenticated,
    // Keep the live list fresh (new/ended streams) without manual refresh.
    pollingInterval: 15000,
    skipPollingIfUnfocused: true,
  })

  const myStream = streams.find((s) => s.hostId === me?.id) ?? null
  const activeStream = streams.find((s) => s.id === activeId) ?? null

  const handleSelect = (id: string) => {
    setActiveId((prev) => (prev === id ? null : id))
  }

  return {
    isAuthenticated,
    me,
    meError,
    streams,
    isLoading,
    streamsError,
    myStream,
    activeStream,
    activeId,
    setActiveId,
    handleSelect,
  }
}
