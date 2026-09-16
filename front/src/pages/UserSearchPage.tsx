import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useUserSearch } from '../features/search/hooks/useUserSearch'
import { useTagSearch } from '../features/search/hooks/useTagSearch'
import SearchBar from '../features/search/components/SearchBar'
import SearchTabs, { type SearchTab } from '../features/search/components/SearchTabs'
import TagResults from '../features/search/components/TagResults'
import UserResults from '../features/search/components/UserResults'
import { useFriendRequests } from '../features/friendship/hooks/useFriendRequests'
import { useSendRequestMutation } from '../features/friendship/friendshipApi'

// UserSearchPage – thin shell for /search: auth guards + SearchBar +
// People/Tags tabs + dumb result lists. Data lives in hooks, JSX in
// features/search/components (same pattern as FeedPage/ProfilePage).
export default function UserSearchPage() {
  const { isAuthenticated, query, setQuery, debouncedTrimmed, users, isLoading, error, isSessionExpired } = useUserSearch()
  const [tab, setTab] = useState<SearchTab>('people')
  const { tags, tagsLoading } = useTagSearch(debouncedTrimmed, tab === 'tags')
  const { currentUserId, pending, accept, cancel, decline, isRemoving, isAccepting } = useFriendRequests()
  const [sendRequest, { isLoading: isSending }] = useSendRequestMutation()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (isSessionExpired) return <Navigate to="/login" replace />

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 px-4 py-8 dark:bg-[#16171d]">
      <div className="mx-auto max-w-3xl">
        <SearchBar value={query} onChange={setQuery} />
        <SearchTabs tab={tab} onChange={setTab} />

        {tab === 'tags' ? (
          <TagResults query={debouncedTrimmed} tags={tags} isLoading={tagsLoading} />
        ) : (
          <UserResults
            query={debouncedTrimmed}
            users={users}
            isLoading={isLoading}
            error={error}
            currentUserId={currentUserId}
            pending={pending}
            isRemoving={isRemoving}
            isAccepting={isAccepting}
            isSending={isSending}
            onAccept={accept}
            onCancel={cancel}
            onDecline={decline}
            onSend={(addresseeId) => currentUserId && sendRequest({ requesterId: currentUserId, addresseeId })}
          />
        )}
      </div>
    </div>
  )
}
