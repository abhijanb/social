import type { Post } from '../postsApi'
import { resolveImageUrl } from '../resolvePostImage'
import PostCarousel from './PostCarousel'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

// PostCard – Instagram-style post: header with ring avatar, username and
// time on one line; media full-bleed edge-to-edge; text body below.
export default function PostCard({ post }: { post: Post }) {
  const items = [...(post.images ?? [])]
    .sort((a, b) => a.order - b.order)
    .map((img) => ({ src: resolveImageUrl(img.url), kind: img.kind }))
    .filter(
      (item): item is { src: string; kind: (typeof item)['kind'] } =>
        item.src != null,
    )
  const albumLabel =
    items.length > 1
      ? items.every((i) => i.kind === 'VIDEO')
        ? `${items.length} videos`
        : items.every((i) => i.kind === 'IMAGE')
          ? `${items.length} photos`
          : `${items.length} items`
      : null
  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-zinc-700/80 dark:bg-zinc-900 dark:shadow-black/20 dark:hover:shadow-black/40">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="rounded-full bg-gradient-to-tr from-[#aa3bff] via-fuchsia-500 to-amber-400 p-0.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-semibold text-gray-900 dark:bg-zinc-900 dark:text-white">
            {post.author.username.charAt(0).toUpperCase()}
          </div>
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{post.author.username}</p>
          <p className="text-xs text-gray-500 dark:text-zinc-400">{timeAgo(post.createdAt)}</p>
        </div>
        {albumLabel && (
          <span className="shrink-0 rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold text-gray-500 dark:bg-zinc-800 dark:text-zinc-400">
            {albumLabel}
          </span>
        )}
      </div>
      {items.length > 0 && (
        <PostCarousel key={post.id} items={items} alt={`Post by ${post.author.username}`} />
      )}
      {post.text && (
        <p className="whitespace-pre-wrap break-words px-4 py-3 text-sm leading-relaxed text-gray-900 dark:text-zinc-100">
          <span className="mr-2 font-semibold">{post.author.username}</span>
          {post.text}
        </p>
      )}
    </article>
  )
}
