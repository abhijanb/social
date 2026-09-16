import { Link } from 'react-router-dom'

const TAG_RE = /#(\p{L}[\p{L}\p{N}_]*)/gu

// HashtagText – renders post text with #tags as links to /tag/:tag.
// Matches backend extractHashtags (letter-first, then letters/numbers/_).
export default function HashtagText({ text }: { text: string }) {
  const parts: React.ReactNode[] = []
  let last = 0
  let i = 0
  for (const match of text.matchAll(TAG_RE)) {
    const idx = match.index ?? -1
    if (idx < 0) continue
    if (idx > last) parts.push(text.slice(last, idx))
    const tag = match[1].toLowerCase()
    parts.push(
      <Link
        key={`${tag}-${i++}`}
        to={`/tag/${encodeURIComponent(tag)}`}
        className="font-medium text-violet-600 hover:underline dark:text-violet-400"
      >
        #{match[1]}
      </Link>,
    )
    last = idx + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return <>{parts}</>
}
