import PostSkeleton from './PostSkeleton'

// PostFeedLoading – dumb initial-loading skeletons for PostFeed. No hooks here.
export default function PostFeedLoading() {
  return (
    <div className="mt-4 space-y-4">
      <PostSkeleton />
      <PostSkeleton withMedia={false} />
      <PostSkeleton />
    </div>
  )
}
