import * as React from "react"

import { DiscussionPostCardDrawer } from "./discussion-post-card-drawer"
import { DiscussionPostCardPreview } from "./discussion-post-card-preview"
import type {
  DiscussionPostCardProps,
  DrawerDirection,
  VoteDirection,
} from "./types"

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
  hideDownvoteCount = false,
  onUpvoteClick,
  onDownvoteClick,
  initialBookmarked = false,
  replies = [],
  replyText,
  onReplyTextChange,
  onReplySubmit,
  replyPlaceholder,
  drawerDirection = "auto",
  drawerBottomInsetClassName,
  drawerBodyClassName,
  drawerPinFooter = true,
  drawerFooterClassName,
}: DiscussionPostCardProps) {
  const [open, setOpen] = React.useState(false)
  const [isBookmarked, setIsBookmarked] = React.useState(initialBookmarked)
  const [voteDirection, setVoteDirection] = React.useState<VoteDirection>(null)
  const [voteCounts, setVoteCounts] = React.useState({
    upvotes: currentUpvoteCount,
    downvotes: currentDownvoteCount,
  })
  const resolvedDirection = useResolvedDirection(drawerDirection)

  React.useEffect(() => {
    setVoteCounts({
      upvotes: currentUpvoteCount,
      downvotes: currentDownvoteCount,
    })
  }, [currentUpvoteCount, currentDownvoteCount])

  const handleUpvoteClick = () => {
    setVoteCounts((current) => {
      if (voteDirection === "up") {
        setVoteDirection(null)
        return {
          upvotes: Math.max(current.upvotes - 1, 0),
          downvotes: current.downvotes,
        }
      }

      if (voteDirection === "down") {
        setVoteDirection("up")
        return {
          upvotes: current.upvotes + 1,
          downvotes: Math.max(current.downvotes - 1, 0),
        }
      }

      setVoteDirection("up")
      return {
        upvotes: current.upvotes + 1,
        downvotes: current.downvotes,
      }
    })
    onUpvoteClick()
  }

  const handleDownvoteClick = () => {
    setVoteCounts((current) => {
      if (voteDirection === "down") {
        setVoteDirection(null)
        return {
          upvotes: current.upvotes,
          downvotes: Math.max(current.downvotes - 1, 0),
        }
      }

      if (voteDirection === "up") {
        setVoteDirection("down")
        return {
          upvotes: Math.max(current.upvotes - 1, 0),
          downvotes: current.downvotes + 1,
        }
      }

      setVoteDirection("down")
      return {
        upvotes: current.upvotes,
        downvotes: current.downvotes + 1,
      }
    })
    onDownvoteClick()
  }

  return (
    <>
      <DiscussionPostCardPreview
        profileImage={profileImage}
        name={name}
        createdAt={createdAt}
        content={content}
        currentUpvoteCount={voteCounts.upvotes}
        currentDownvoteCount={voteCounts.downvotes}
        hideDownvoteCount={hideDownvoteCount}
        voteDirection={voteDirection}
        isBookmarked={isBookmarked}
        onBookmarkClick={() => setIsBookmarked((current) => !current)}
        onUpvoteClick={handleUpvoteClick}
        onDownvoteClick={handleDownvoteClick}
        onReplyClick={() => setOpen(true)}
        replyCount={replies.length}
      />

      <DiscussionPostCardDrawer
        profileImage={profileImage}
        name={name}
        createdAt={createdAt}
        content={content}
        currentUpvoteCount={voteCounts.upvotes}
        currentDownvoteCount={voteCounts.downvotes}
        hideDownvoteCount={hideDownvoteCount}
        voteDirection={voteDirection}
        onUpvoteClick={handleUpvoteClick}
        onDownvoteClick={handleDownvoteClick}
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
        drawerBottomInsetClassName={drawerBottomInsetClassName}
        drawerBodyClassName={drawerBodyClassName}
        drawerPinFooter={drawerPinFooter}
        drawerFooterClassName={drawerFooterClassName}
      />
    </>
  )
}
