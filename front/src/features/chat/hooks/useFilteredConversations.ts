import { useMemo } from 'react'
import type { Conversation } from '../types'

// useFilteredConversations – name filter + online-first sort for ChatSidebar, no JSX.
export function useFilteredConversations(
  conversations: Conversation[],
  filter: string,
  isOnline?: (id: string) => boolean,
): Conversation[] {
  return useMemo(
    () =>
      [...conversations]
        .filter((c) => c.username.toLowerCase().includes(filter.toLowerCase()))
        .sort((a, b) => {
          if (!isOnline) return 0
          const aOn = isOnline(a.id) ? 0 : 1
          const bOn = isOnline(b.id) ? 0 : 1
          return aOn - bOn
        }),
    [conversations, filter, isOnline],
  )
}
