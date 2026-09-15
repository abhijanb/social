import type { Post } from '../postsApi'

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

export default function PostCard({ post }: { post: Post }) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-[#aa3bff] text-sm font-semibold text-white">
          {post.author.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{post.author.username}</p>
          <p className="text-xs text-gray-500 dark:text-zinc-400">{timeAgo(post.createdAt)}</p>
        </div>
      </div>
      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-900 dark:text-zinc-100">
        {post.text}
      </p>
    </article>
  )
}
