import { useEffect, useState } from 'react'
import MasaiverseDiscussionPostDrawer from './MasaiverseDiscussionPostDrawer'
import type { DiscussionReply as DiscussionPostCardReply } from '@/components/discussion-post-card'
import { DiscussionPostCardPreview } from '@/components/discussion-post-card/discussion-post-card-preview'

type MasaiverseDiscussionPostCardProps = {
  profileImage: string
  composerProfileImage?: string
  name: string
  createdAt: string
  content: string
  currentUpvoteCount: number
  currentDownvoteCount: number
  voteDirection?: 'up' | 'down' | null
  onUpvoteClick: () => void
  onDownvoteClick: () => void
  initialBookmarked?: boolean
  onBookmarkToggle?: () => Promise<void>
  replies?: Array<DiscussionPostCardReply>
  replyText: string
  onReplyTextChange: (value: string) => void
  onReplySubmit?: () => void
  onVoteReply: (replyId: string, vote: 'upvote' | 'downvote') => Promise<void>
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const getDrawerDirection = () => {
  if (typeof window === 'undefined') {
    return 'right' as const
  }
  return window.matchMedia('(min-width: 768px)').matches ? 'right' : 'bottom'
}

export default function MasaiverseDiscussionPostCard({
  profileImage,
  composerProfileImage,
  name,
  createdAt,
  content,
  currentUpvoteCount,
  currentDownvoteCount,
  voteDirection = null,
  onUpvoteClick,
  onDownvoteClick,
  initialBookmarked = false,
  onBookmarkToggle,
  replies = [],
  replyText,
  onReplyTextChange,
  onReplySubmit,
  onVoteReply,
  open,
  onOpenChange,
}: MasaiverseDiscussionPostCardProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked)
  const [drawerDirection, setDrawerDirection] = useState<'right' | 'bottom'>(getDrawerDirection)
  const isControlled = typeof open === 'boolean'
  const resolvedOpen = isControlled ? open : internalOpen

  const setResolvedOpen = (nextOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(nextOpen)
    }
    onOpenChange?.(nextOpen)
  }

  useEffect(() => {
    setIsBookmarked(initialBookmarked)
  }, [initialBookmarked])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)')
    const sync = () => {
      setDrawerDirection(mediaQuery.matches ? 'right' : 'bottom')
    }
    sync()
    mediaQuery.addEventListener('change', sync)
    return () => mediaQuery.removeEventListener('change', sync)
  }, [])

  const handleBookmarkClick = () => {
    setIsBookmarked((current) => !current)
    void onBookmarkToggle?.()
  }

  return (
    <>
      <DiscussionPostCardPreview
        profileImage={profileImage}
        name={name}
        createdAt={createdAt}
        content={content}
        currentUpvoteCount={currentUpvoteCount}
        currentDownvoteCount={currentDownvoteCount}
        voteDirection={voteDirection}
        hideDownvoteCount={true}
        isBookmarked={isBookmarked}
        onBookmarkClick={handleBookmarkClick}
        onUpvoteClick={onUpvoteClick}
        onDownvoteClick={onDownvoteClick}
        onReplyClick={() => setResolvedOpen(true)}
        replyCount={replies.length}
      />
      <MasaiverseDiscussionPostDrawer
        profileImage={profileImage}
        composerProfileImage={composerProfileImage}
        name={name}
        createdAt={createdAt}
        content={content}
        currentUpvoteCount={currentUpvoteCount}
        currentDownvoteCount={currentDownvoteCount}
        voteDirection={voteDirection}
        onUpvoteClick={onUpvoteClick}
        onDownvoteClick={onDownvoteClick}
        replies={replies}
        onVoteReply={onVoteReply}
        replyText={replyText}
        onReplyTextChange={onReplyTextChange}
        onReplySubmit={onReplySubmit}
        isBookmarked={isBookmarked}
        onBookmarkClick={handleBookmarkClick}
        open={resolvedOpen}
        onOpenChange={setResolvedOpen}
        resolvedDirection={drawerDirection}
      />
    </>
  )
}
