// Notification types – mirrors backend Notification model + NotificationType enum
// (backend/src/.../notification, prisma/schema.prisma). Dates arrive as ISO strings.
export type NotificationType =
  | 'FRIEND_REQUEST'
  | 'FRIEND_ACCEPTED'
  | 'POST_LIKE'
  | 'POST_COMMENT'
  | 'STORY_VIEW'
  | 'LIVESTREAM_COMMENT'

export type Notification = {
  id: string
  userId: string
  type: NotificationType
  content: string
  isRead: boolean
  createdAt: string
  relatedPost?: string | null
  relatedUser?: string | null
}
