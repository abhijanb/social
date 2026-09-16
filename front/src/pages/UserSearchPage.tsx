import { Navigate } from 'react-router-dom'
import SearchBar from '../features/search/components/SearchBar'
import SearchTabs from '../features/search/components/SearchTabs'
import TagResults from '../features/search/components/TagResults'
import UserResults from '../features/search/components/UserResults'
import { useUserSearchPage } from '../features/search/hooks/useUserSearchPage'

// UserSearchPage – thin shell for /search: guards + SearchBar + tabs + lists.
// All data + wiring lives in useUserSearchPage (same pattern as useFeed).
export default function UserSearchPage() {
  const {
    isAuthenticated,
    query,
    setQuery,
    debouncedTrimmed,
    users,
    isLoading,
    error,
    isSessionExpired,
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
  } = useUserSearchPage()

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
            onSend={handleSend}
          />
        )}
      </div>
    </div>
  )
}
