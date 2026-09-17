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
  const { currentUserId, pending, accept, cancel, decline, isRemoving, isAccepting } = useFriendRequests()
  const [sendRequest, { isLoading: isSending }] = useSendRequestMutation()

  const handleSend = (addresseeId: string) => {
    if (currentUserId) sendRequest({ requesterId: currentUserId, addresseeId })
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
    accept,
    cancel,
    decline,
    handleSend,
  }
}
