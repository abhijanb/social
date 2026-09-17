import { useEffect, useMemo, useState } from 'react'
import { useGetMeQuery } from '../../users/usersApi'
import { useGetFriendsQuery } from '../../friendship/friendshipApi'
import { usePresence } from '../../presence/hooks/usePresence'
import { useAppDispatch } from '../../../app/hooks'
import { isUnauthorizedError } from '../../../app/apiError'
import { useAuth } from '../../auth/hooks/useAuth'
import { logout } from '../../auth/authSlice'
import type { Conversation } from '../types'

export function useChatConversations() {
  const { isAuthenticated } = useAuth()
  const dispatch = useAppDispatch()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [filter, setFilter] = useState('')

  const { data: me, error: meError } = useGetMeQuery(undefined, { skip: !isAuthenticated })
  const currentUserId = me?.id

  useEffect(() => {
    if (isUnauthorizedError(meError)) dispatch(logout())
  }, [meError, dispatch])

  const { data: friends, isLoading: isLoadingFriends, error: friendsError } = useGetFriendsQuery(currentUserId!, {
    skip: !currentUserId,
  })

  useEffect(() => {
    if (isUnauthorizedError(friendsError)) dispatch(logout())
  }, [friendsError, dispatch])

  const conversations: Conversation[] = useMemo(() => {
    if (!friends) return []
    return friends.map((f) => ({
      id: f.friend.id,
      username: f.friend.username,
      avatarUrl: f.friend.avatarUrl ?? null,
      lastMessage: '',
    }))
  }, [friends])

  const friendIds = useMemo(() => conversations.map((c) => c.id), [conversations])
  const { isOnline, lastSeen } = usePresence(friendIds)

  useEffect(() => {
    if (!activeId && conversations.length > 0) setActiveId(conversations[0].id)
    if (activeId && conversations.length > 0 && !conversations.find((c) => c.id === activeId)) {
      setActiveId(conversations[0].id)
    }
    if (conversations.length === 0) setActiveId(null)
  }, [conversations, activeId])

  return {
    currentUserId,
    conversations,
    activeId,
    setActiveId,
    filter,
    setFilter,
    isOnline,
    lastSeen,
    isLoadingFriends,
  }
}
