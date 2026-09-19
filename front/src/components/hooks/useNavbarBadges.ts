import { useAppSelector } from '../../app/hooks'
import { useFriendRequests } from '../../features/friendship/hooks/useFriendRequests'
import { useOwnProfile } from '../../features/users/hooks/useOwnProfile'

// useNavbarBadges – badge + identity data for Navbar, no JSX.
// Reuses cached RTK queries (skipped when logged out). The live list is
// NOT fetched here: /live owns it via useLivestreamPage, so other pages
// make no livestream/live calls.
export function useNavbarBadges() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  // Badges reuse cached RTK queries (skipped when logged out).
  const { received } = useFriendRequests()
  // Own identity paints instantly from localStorage cache, reconciled by getMe.
  const { username, avatarUrl } = useOwnProfile()
  return {
    isAuthenticated,
    pendingCount: received?.length ?? 0,
    username,
    avatarUrl,
  }
}
