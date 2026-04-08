import { useEffect, useState } from 'react'
import { DiscussionPostCardPreview } from '@/components/discussion-post-card/discussion-post-card-preview'
import type { DiscussionReply as DiscussionPostCardReply } from '@/components/discussion-post-card'
import MasaiverseDiscussionPostDrawer from './MasaiverseDiscussionPostDrawer'

type MasaiverseDiscussionPostCardProps = {
  profileImage: string
  name: string
  createdAt: string
  content: string
  currentUpvoteCount: number
  currentDownvoteCount: number
  onUpvoteClick: () => void
  onDownvoteClick: () => void
  initialBookmarked?: boolean
  onBookmarkToggle?: () => Promise<void>
  replies?: Array<DiscussionPostCardReply>
  replyText: string
  onReplyTextChange: (value: string) => void
  onReplySubmit?: () => void
  onVoteReply: (replyId: string, vote: 'upvote' | 'downvote') => Promise<void>
}

const getDrawerDirection = () => {
  if (typeof window === 'undefined') {
    return 'right' as const
  }
  return window.matchMedia('(min-width: 768px)').matches ? 'right' : 'bottom'
}

export default function MasaiverseDiscussionPostCard({
  profileImage,
  name,
  createdAt,
  content,
  currentUpvoteCount,
  currentDownvoteCount,
  onUpvoteClick,
  onDownvoteClick,
  initialBookmarked = false,
  onBookmarkToggle,
  replies = [],
  replyText,
  onReplyTextChange,
  onReplySubmit,
  onVoteReply,
}: MasaiverseDiscussionPostCardProps) {
  const [open, setOpen] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked)
  const [drawerDirection, setDrawerDirection] = useState<'right' | 'bottom'>(getDrawerDirection)

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
        isBookmarked={isBookmarked}
        onBookmarkClick={handleBookmarkClick}
        onUpvoteClick={onUpvoteClick}
        onDownvoteClick={onDownvoteClick}
        onReplyClick={() => setOpen(true)}
        replyCount={replies.length}
      />
      <MasaiverseDiscussionPostDrawer
        profileImage={profileImage}
        name={name}
        createdAt={createdAt}
        content={content}
        currentUpvoteCount={currentUpvoteCount}
        currentDownvoteCount={currentDownvoteCount}
        onUpvoteClick={onUpvoteClick}
        onDownvoteClick={onDownvoteClick}
        replies={replies}
        onVoteReply={onVoteReply}
        replyText={replyText}
        onReplyTextChange={onReplyTextChange}
        onReplySubmit={onReplySubmit}
        isBookmarked={isBookmarked}
        onBookmarkClick={handleBookmarkClick}
        open={open}
        onOpenChange={setOpen}
        resolvedDirection={drawerDirection}
      />
    </>
  )
}
