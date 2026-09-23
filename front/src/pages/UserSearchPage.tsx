import SearchBar from '../features/search/components/SearchBar'
import SearchTabs from '../features/search/components/SearchTabs'
import TagResults from '../features/search/components/TagResults'
import UserResults from '../features/search/components/UserResults'
import { useUserSearchPage } from '../features/search/hooks/useUserSearchPage'

// UserSearchPage – thin shell for /search: SearchBar + tabs + lists.
// Auth is gated by ProtectedLayout; stale sessions log out via the search hooks.
export default function UserSearchPage() {
  const {
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
  } = useUserSearchPage()

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
            actionError={acceptError ?? removeError ?? sendError}
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
