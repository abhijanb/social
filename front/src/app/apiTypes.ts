// Shared API payload shapes – single source of truth (were copy-pasted
// per feature as PostAuthor/StoryAuthor/FriendshipUser/LivestreamHost and
// PostMediaKind/StoryMediaKind). Features keep their own aliases so existing
// imports keep working with zero ripple.
export type ApiMiniUser = {
  id: string
  username: string
  avatarUrl: string | null
}

export type MediaKind = 'IMAGE' | 'VIDEO'
