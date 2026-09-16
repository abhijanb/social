import Avatar from '../../../components/Avatar'
import type { LivestreamComment } from '../livestreamApi'

// LivestreamComments – dumb comment list for a live room with auto-scroll anchor.
// Data comes from useLivestreamComments in the parent; no hooks here.
export default function LivestreamComments({
  comments,
  isLoading,
  bottomRef,
}: {
  comments: LivestreamComment[]
  isLoading: boolean
  bottomRef: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-3">
      {isLoading && comments.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500 dark:text-zinc-400">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500 dark:text-zinc-400">No comments yet — say hi!</p>
      ) : (
        <ul className="space-y-2">
          {comments.map((c) => (
            <li key={c.id} className="flex items-start gap-2 text-sm leading-relaxed">
              <Avatar username={c.author.username} avatarUrl={c.author.avatarUrl} size="xs" className="mt-0.5" />
              <p className="min-w-0 flex-1">
                <span className="mr-2 font-medium text-gray-900 dark:text-white">{c.author.username}</span>
                <span className="break-words text-gray-700 dark:text-zinc-200">{c.text}</span>
              </p>
            </li>
          ))}
        </ul>
      )}
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  )
}
