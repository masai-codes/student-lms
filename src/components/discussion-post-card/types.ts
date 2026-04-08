export type DrawerDirection = "right" | "bottom" | "auto"

export type DiscussionReply = {
  id: string
  profileImage?: string
  author: string
  createdAt: string
  content: string
  currentUpvoteCount?: number
  currentDownvoteCount?: number
}

export type DiscussionPostCardProps = {
  profileImage: string
  name: string
  createdAt: string
  content: string
  currentUpvoteCount: number
  currentDownvoteCount: number
  onUpvoteClick: () => void
  onDownvoteClick: () => void
  initialBookmarked?: boolean
  replies?: DiscussionReply[]
  replyText: string
  onReplyTextChange: (value: string) => void
  onReplySubmit?: () => void
  drawerDirection?: DrawerDirection
}
