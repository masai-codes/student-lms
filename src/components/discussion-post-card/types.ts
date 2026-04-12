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
  /**
   * Merged onto `Dialog.Content` — use on bottom sheets to clear a fixed bottom tab bar, e.g.
   * `pb-[calc(4.5rem+env(safe-area-inset-bottom))]`.
   */
  drawerBottomInsetClassName?: string
  /** Extra classes on the scrollable thread body. */
  drawerBodyClassName?: string
  /**
   * When `true` (default), the reply composer stays in a fixed footer below the scroll area.
   * When `false`, the composer scrolls with the thread.
   */
  drawerPinFooter?: boolean
  /** Merged onto the composer/footer wrapper when `drawerPinFooter` is true. */
  drawerFooterClassName?: string
}
