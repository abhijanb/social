import { useState } from 'react'
import { useSendRequestMutation } from '../../friendship/friendshipApi'
import { useFriendRequests } from '../../friendship/hooks/useFriendRequests'
import type { SearchTab } from '../components/SearchTabs'
import { useTagSearch } from './useTagSearch'
import { useUserSearch } from './useUserSearch'

// useUserSearchPage – all data + tab + friendship wiring for /search, no JSX.
// Single hook so the page stays a thin shell like Feed/Tag/Profile.
export function useUserSearchPage() {
  const { query, setQuery, debouncedTrimmed, users, isLoading, error } = useUserSearch()
  const [tab, setTab] = useState<SearchTab>('people')
  const { tags, tagsLoading } = useTagSearch(debouncedTrimmed, tab === 'tags')
  const { currentUserId, pending, accept, cancel, decline, acceptError, removeError, isRemoving, isAccepting } = useFriendRequests()
  const [sendRequest, { isLoading: isSending, error: sendError }] = useSendRequestMutation()

  const handleSend = async (addresseeId: string) => {
    if (!currentUserId) return
    try {
      await sendRequest({ requesterId: currentUserId, addresseeId }).unwrap()
    } catch {
      // surfaced via sendError below
    }
  }

  return {
    query,
    setQuery,
    debouncedTrimmed,
    users,
    isLoading,
    error,
    tab,
    setTab,
    tags,
    tagsLoading,
    currentUserId,
    pending,
    isRemoving,
    isAccepting,
    isSending,
    acceptError,
    removeError,
    sendError,
    accept,
    cancel,
    decline,
    handleSend,
  }
}
