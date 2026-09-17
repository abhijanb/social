import { useAppSelector } from '../../app/hooks'
import { useFriendRequests } from '../../features/friendship/hooks/useFriendRequests'
import { useGetLiveStreamsQuery } from '../../features/livestream/livestreamApi'
import { useOwnProfile } from '../../features/users/hooks/useOwnProfile'

// useNavbarBadges – badge + identity data for Navbar, no JSX.
// Reuses cached RTK queries (skipped when logged out).
export function useNavbarBadges() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  // Badges reuse cached RTK queries (skipped when logged out).
  const { received } = useFriendRequests()
  // Own identity paints instantly from localStorage cache, reconciled by getMe.
  const { username, avatarUrl } = useOwnProfile()
  const { data: liveStreams } = useGetLiveStreamsQuery(undefined, {
    skip: !isAuthenticated,
    pollingInterval: 30000,
    skipPollingIfUnfocused: true,
  })
  return {
    isAuthenticated,
    pendingCount: received?.length ?? 0,
    anyoneLive: (liveStreams?.length ?? 0) > 0,
    username,
    avatarUrl,
  }
}
