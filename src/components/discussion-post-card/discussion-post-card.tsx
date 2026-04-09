import * as React from "react"

import { DiscussionPostCardDrawer } from "./discussion-post-card-drawer"
import { DiscussionPostCardPreview } from "./discussion-post-card-preview"
import type { DiscussionPostCardProps, DrawerDirection } from "./types"

function useResolvedDirection(direction: DrawerDirection) {
  const [isDesktop, setIsDesktop] = React.useState(false)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)")
    const sync = () => setIsDesktop(mediaQuery.matches)
    sync()
    mediaQuery.addEventListener("change", sync)
    return () => mediaQuery.removeEventListener("change", sync)
  }, [])

  return direction === "auto" ? (isDesktop ? "right" : "bottom") : direction
}

export function DiscussionPostCard({
  profileImage,
  name,
  createdAt,
  content,
  currentUpvoteCount,
  currentDownvoteCount,
  onUpvoteClick,
  onDownvoteClick,
  initialBookmarked = false,
  replies = [],
  replyText,
  onReplyTextChange,
  onReplySubmit,
  replyPlaceholder,
  drawerDirection = "auto",
}: DiscussionPostCardProps) {
  const [open, setOpen] = React.useState(false)
  const [isBookmarked, setIsBookmarked] = React.useState(initialBookmarked)
  const resolvedDirection = useResolvedDirection(drawerDirection)

  return (
    <>
      <DiscussionPostCardPreview
        profileImage={profileImage}
        name={name}
        createdAt={createdAt}
        content={content}
        currentUpvoteCount={currentUpvoteCount}
        currentDownvoteCount={currentDownvoteCount}
        isBookmarked={isBookmarked}
        onBookmarkClick={() => setIsBookmarked((current) => !current)}
        onUpvoteClick={onUpvoteClick}
        onDownvoteClick={onDownvoteClick}
        onReplyClick={() => setOpen(true)}
        replyCount={replies.length}
      />

      <DiscussionPostCardDrawer
        profileImage={profileImage}
        name={name}
        createdAt={createdAt}
        content={content}
        currentUpvoteCount={currentUpvoteCount}
        currentDownvoteCount={currentDownvoteCount}
        onUpvoteClick={onUpvoteClick}
        onDownvoteClick={onDownvoteClick}
        replies={replies}
        replyText={replyText}
        onReplyTextChange={onReplyTextChange}
        onReplySubmit={onReplySubmit}
        replyPlaceholder={replyPlaceholder}
        isBookmarked={isBookmarked}
        onBookmarkClick={() => setIsBookmarked((current) => !current)}
        open={open}
        onOpenChange={setOpen}
        resolvedDirection={resolvedDirection}
      />
    </>
  )
}
