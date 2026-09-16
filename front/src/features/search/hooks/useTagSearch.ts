import { useSearchTagsQuery } from '../../posts/hashtagsApi'

// useTagSearch – normalizes the shared debounced query for tags
// (strips leading #'s, lowercase) and runs tag autocomplete.
// Dumb-hook split from UserSearchPage; page enables it on the Tags tab only.
export function useTagSearch(debouncedTrimmed: string, enabled: boolean) {
  const tagQ = debouncedTrimmed.replace(/^#+/, '').toLowerCase()
  const { data: tags, isLoading: tagsLoading } = useSearchTagsQuery(
    { q: tagQ },
    { skip: !enabled || !tagQ },
  )
  return { tagQ, tags, tagsLoading }
}
