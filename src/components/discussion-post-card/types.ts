export type DrawerDirection = "right" | "bottom" | "auto"
export type VoteDirection = "up" | "down" | null

export type DiscussionReply = {
  id: string
  profileImage?: string
  author: string
  createdAt: string
  content: string
  currentUpvoteCount?: number
  currentDownvoteCount?: number
  voteDirection?: VoteDirection
}

export type DiscussionPostCardProps = {
  profileImage: string
  name: string
  createdAt: string
  content: string
  currentUpvoteCount: number
  currentDownvoteCount: number
  voteDirection?: VoteDirection
  hideDownvoteCount?: boolean
  onUpvoteClick: () => void
  onDownvoteClick: () => void
  initialBookmarked?: boolean
  replies?: Array<DiscussionReply>
  replyText: string
  onReplyTextChange: (value: string) => void
  onReplySubmit?: () => void
  replyPlaceholder?: string
  drawerDirection?: DrawerDirection
}
