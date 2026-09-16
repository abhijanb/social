import { useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../../../components/Avatar'
import { useOwnProfile } from '../../users/hooks/useOwnProfile'
import type { Post } from '../postsApi'
import { resolveImageUrl } from '../resolvePostImage'
import CommentSection from './CommentSection'
import LikeButton from './LikeButton'
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
// time on one line; media full-bleed edge-to-edge; like unit and text
// body below.
export default function PostCard({
  post,
  onToggleLike,
  likePending = false,
  onCommentAdded,
  onCommentDeleted,
  onPostDeleted,
}: {
  post: Post
  onToggleLike?: (postId: string) => void
  likePending?: boolean
  onCommentAdded?: (postId: string) => void
  onCommentDeleted?: (postId: string) => void
  onPostDeleted?: (postId: string) => void
}) {
  const { me } = useOwnProfile()
  const [menuOpen, setMenuOpen] = useState(false)
  const isOwn = me?.id != null && me.id === post.authorId
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
          <div className="rounded-full bg-white p-0.5 dark:bg-zinc-900">
            <Avatar username={post.author.username} avatarUrl={post.author.avatarUrl} size="md" />
          </div>
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <Link
            to={`/u/${encodeURIComponent(post.author.username)}`}
            className="truncate text-sm font-semibold text-gray-900 hover:underline dark:text-white"
          >
            {post.author.username}
          </Link>
          <p className="text-xs text-gray-500 dark:text-zinc-400">{timeAgo(post.createdAt)}</p>
        </div>
        {albumLabel && (
          <span className="shrink-0 rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold text-gray-500 dark:bg-zinc-800 dark:text-zinc-400">
            {albumLabel}
          </span>
        )}
        {isOwn && onPostDeleted && (
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Post options"
              className="rounded-full p-1.5 text-gray-500 transition hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="5" cy="12" r="1.8" />
                <circle cx="12" cy="12" r="1.8" />
                <circle cx="19" cy="12" r="1.8" />
              </svg>
            </button>
            {menuOpen && (
              <>
                <button
                  aria-label="Close menu"
                  onClick={() => setMenuOpen(false)}
                  className="fixed inset-0 z-10 cursor-default"
                />
                <div className="absolute right-0 z-20 w-36 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      if (window.confirm('Delete this post? This cannot be undone.')) {
                        onPostDeleted(post.id)
                      }
                    }}
                    className="block w-full px-4 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      {items.length > 0 && (
        <PostCarousel key={post.id} items={items} alt={`Post by ${post.author.username}`} />
      )}
      <LikeButton
        postId={post.id}
        likedByMe={post.likedByMe}
        likesCount={post.likesCount}
        hasCaption={!!post.text}
        onToggleLike={onToggleLike}
        likePending={likePending}
      />
      {post.text && (
        <p className="whitespace-pre-wrap break-words px-4 pb-3 pt-1 text-sm leading-relaxed text-gray-900 dark:text-zinc-100">
          <Link to={`/u/${encodeURIComponent(post.author.username)}`} className="mr-2 font-semibold hover:underline">
            {post.author.username}
          </Link>
          {post.text}
        </p>
      )}
      {!post.text && post.likesCount === 0 && <div className="pb-3" />}
      <CommentSection postId={post.id} postAuthorId={post.authorId} commentsCount={post.commentsCount ?? 0} onCommentAdded={onCommentAdded} onCommentDeleted={onCommentDeleted} />
    </article>
  )
}
