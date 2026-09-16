import { Link } from 'react-router-dom'
import type { HashtagHit } from '../../posts/hashtagsApi'

// TagResults – dumb list for the Tags tab: loading / empty / #tag rows.
// Data comes from useTagSearch in the page; no hooks here.
export default function TagResults({
  query,
  tags,
  isLoading,
}: {
  query: string
  tags: HashtagHit[] | undefined
  isLoading: boolean
}) {
  if (!query) return null
  if (isLoading) {
    return <p className="mt-6 text-center text-sm text-gray-500 dark:text-zinc-400">Searching tags...</p>
  }
  if (!tags) return null
  if (tags.length === 0) {
    return (
      <p className="mt-6 text-center text-sm text-gray-500 dark:text-zinc-400">
        No tags found{query ? ` for "${query}"` : ''}
      </p>
    )
  }
  return (
    <ul className="mt-6 space-y-2">
      {tags.map((h) => (
        <li key={h.tag} className="rounded-lg border border-gray-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800">
          <Link
            to={`/tag/${encodeURIComponent(h.tag)}`}
            className="font-medium text-violet-600 hover:underline dark:text-violet-400"
          >
            #{h.tag}
          </Link>
          <span className="ml-2 text-sm text-gray-500 dark:text-zinc-400">{h.postsCount} posts</span>
        </li>
      ))}
    </ul>
  )
}
