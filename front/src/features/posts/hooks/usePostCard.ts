import { useMemo, useState } from 'react'
import { useOwnProfile } from '../../users/hooks/useOwnProfile'
import type { Post } from '../postsApi'
import { resolveImageUrl } from '../resolvePostImage'

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

// usePostCard – derived display data + owner menu state for PostCard, no JSX.
// Memoizes media derivation so per-render sort/map/filter doesn't repeat.
export function usePostCard(post: Post, onPostDeleted?: (postId: string) => void) {
  const { me } = useOwnProfile()
  const [menuOpen, setMenuOpen] = useState(false)
  const isOwn = me?.id != null && me.id === post.authorId
  const canShowMenu = isOwn && !!onPostDeleted

  const items = useMemo(
    () =>
      [...(post.images ?? [])]
        .sort((a, b) => a.order - b.order)
        .map((img) => ({ src: resolveImageUrl(img.url), kind: img.kind }))
        .filter(
          (item): item is { src: string; kind: (typeof item)['kind'] } => item.src != null,
        ),
    [post.images],
  )

  const albumLabel = useMemo(
    () =>
      items.length > 1
        ? items.every((i) => i.kind === 'VIDEO')
          ? `${items.length} videos`
          : items.every((i) => i.kind === 'IMAGE')
            ? `${items.length} photos`
            : `${items.length} items`
        : null,
    [items],
  )

  const timeLabel = useMemo(() => timeAgo(post.createdAt), [post.createdAt])

  const handleDelete = () => {
    setMenuOpen(false)
    if (window.confirm('Delete this post? This cannot be undone.')) {
      onPostDeleted?.(post.id)
    }
  }

  return { items, albumLabel, timeLabel, isOwn, canShowMenu, menuOpen, setMenuOpen, handleDelete }
}
