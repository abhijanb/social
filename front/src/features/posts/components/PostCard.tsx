import { Link } from 'react-router-dom'
import Avatar from '../../../components/Avatar'
import type { Post } from '../postsApi'
import { usePostCard } from '../hooks/usePostCard'
import CommentSection from './CommentSection'
import HashtagText from './HashtagText'
import LikeButton from './LikeButton'
import PostCarousel from './PostCarousel'
import PostMenu from './PostMenu'
import SaveButton from './SaveButton'

// PostCard – Instagram-style post: header with ring avatar, username and
// time on one line; media full-bleed edge-to-edge; like unit and text
// body below. Display data + menu live in usePostCard.
export default function PostCard({
  post,
  onToggleLike,
  likePending = false,
  onToggleSave,
  savePending = false,
  onCommentAdded,
  onCommentDeleted,
  onPostDeleted,
}: {
  post: Post
  onToggleLike?: (postId: string) => void
  likePending?: boolean
  onToggleSave?: (postId: string) => void
  savePending?: boolean
  onCommentAdded?: (postId: string) => void
  onCommentDeleted?: (postId: string) => void
  onPostDeleted?: (postId: string) => void
}) {
  const { items, albumLabel, timeLabel, canShowMenu, menuOpen, setMenuOpen, handleDelete } = usePostCard(
    post,
    onPostDeleted,
  )
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
          <p className="text-xs text-gray-500 dark:text-zinc-400">{timeLabel}</p>
        </div>
        {albumLabel && (
          <span className="shrink-0 rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold text-gray-500 dark:bg-zinc-800 dark:text-zinc-400">
            {albumLabel}
          </span>
        )}
        {canShowMenu && (
          <PostMenu
            menuOpen={menuOpen}
            onToggle={() => setMenuOpen((v) => !v)}
            onClose={() => setMenuOpen(false)}
            onDelete={handleDelete}
          />
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
        actionRight={
          onToggleSave ? (
            <SaveButton
              postId={post.id}
              savedByMe={post.savedByMe ?? false}
              onToggleSave={onToggleSave}
              savePending={savePending}
            />
          ) : undefined
        }
      />
      {post.text && (
        <p className="whitespace-pre-wrap break-words px-4 pb-3 pt-1 text-sm leading-relaxed text-gray-900 dark:text-zinc-100">
          <Link to={`/u/${encodeURIComponent(post.author.username)}`} className="mr-2 font-semibold hover:underline">
            {post.author.username}
          </Link>
          <HashtagText text={post.text} />
        </p>
      )}
      {!post.text && post.likesCount === 0 && <div className="pb-3" />}
      <CommentSection postId={post.id} postAuthorId={post.authorId} commentsCount={post.commentsCount ?? 0} onCommentAdded={onCommentAdded} onCommentDeleted={onCommentDeleted} />
    </article>
  )
}
