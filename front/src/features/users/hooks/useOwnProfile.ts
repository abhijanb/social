import { useAppSelector } from '../../../app/hooks'
import { useGetMeQuery } from '../usersApi'

// useOwnProfile – own identity with instant paint on reload: live getMe
// data when the shared RTK cache has resolved, localStorage-backed
// authSlice fallback while it loads. getMe reconciles any drift (e.g.
// avatar changed on another device).
export function useOwnProfile() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const fallbackUsername = useAppSelector((state) => state.auth.username)
  const fallbackAvatarUrl = useAppSelector((state) => state.auth.avatarUrl)
  const { data: me } = useGetMeQuery(undefined, { skip: !isAuthenticated })
  return {
    me,
    username: me?.username ?? fallbackUsername,
    avatarUrl: me?.avatarUrl ?? fallbackAvatarUrl ?? null,
  }
}
