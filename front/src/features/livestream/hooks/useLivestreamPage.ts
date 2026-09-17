import { useEffect, useState } from 'react'
import { useAppDispatch } from '../../../app/hooks'
import { isUnauthorizedError } from '../../../app/apiError'
import { logout } from '../../auth/authSlice'
import { useAuth } from '../../auth/hooks/useAuth'
import { useGetMeQuery } from '../../users/usersApi'
import { useGetLiveStreamsQuery } from '../livestreamApi'

// useLivestreamPage – all data + selection logic for /live, no JSX:
// auth, own identity, live list (15s poll), active stream derivation.
export function useLivestreamPage() {
  const { isAuthenticated } = useAuth()
  const dispatch = useAppDispatch()
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

  // Stale session: first 401 logs out, ProtectedLayout redirects — replaces the page-level guard.
  useEffect(() => {
    if (isUnauthorizedError(meError) || isUnauthorizedError(streamsError)) dispatch(logout())
  }, [meError, streamsError, dispatch])

  const myStream = streams.find((s) => s.hostId === me?.id) ?? null
  const activeStream = streams.find((s) => s.id === activeId) ?? null

  const handleSelect = (id: string) => {
    setActiveId((prev) => (prev === id ? null : id))
  }

  return {
    me,
    streams,
    isLoading,
    myStream,
    activeStream,
    activeId,
    setActiveId,
    handleSelect,
  }
}
