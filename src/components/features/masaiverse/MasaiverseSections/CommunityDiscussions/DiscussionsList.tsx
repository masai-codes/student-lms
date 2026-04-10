import { useState } from 'react'
import {
  type DiscussionReply as DiscussionPostCardReply,
} from '@/components/discussion-post-card'
import MasaiverseDiscussionPostCard from './MasaiverseDiscussionPostCard'
import type { DiscussionPost } from '@/server/masaiverse/communityDiscussions'

type DiscussionsListProps = {
  posts: Array<DiscussionPost>
  onVotePost: (postId: string, vote: 'upvote' | 'downvote') => Promise<void>
  onVoteReply: (replyId: string, vote: 'upvote' | 'downvote') => Promise<void>
  onReply: (postId: string, content: string) => Promise<void>
  onToggleBookmark: (postId: string) => Promise<void>
}

const DiscussionsList = ({
  posts,
  onVotePost,
  onVoteReply,
  onReply,
  onToggleBookmark,
}: DiscussionsListProps) => {
  const [replyDrafts, setReplyDrafts] = useState<Partial<Record<string, string>>>({})

  const getFallbackAvatar = (name: string) => {
    const initials = name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'U'

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72"><rect width="100%" height="100%" fill="#F3F4F6"/><text x="50%" y="50%" dy=".35em" text-anchor="middle" fill="#374151" font-family="Arial, sans-serif" font-size="28" font-weight="600">${initials}</text></svg>`
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  }

  const formatTimestamp = (value: string | null) => {
    if (!value) {
      return 'Just now'
    }
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) {
      return 'Just now'
    }
    return parsed.toLocaleString()
  }

  const mapReplies = (post: DiscussionPost): DiscussionPostCardReply[] =>
    post.replies.map((reply) => ({
      id: reply.id,
      profileImage: reply.authorProfileImage ?? getFallbackAvatar(reply.authorName),
      author: reply.authorName,
      createdAt: formatTimestamp(reply.createdAt),
      content: reply.content,
      currentUpvoteCount: reply.upvotes,
      currentDownvoteCount: reply.downvotes,
      voteDirection:
        reply.myVote === 'upvote'
          ? 'up'
          : reply.myVote === 'downvote'
            ? 'down'
            : null,
    }))

  if (posts.length === 0) {
    return (
      <div className="rounded-lg border border-[#E5E7EB] bg-white p-4 text-sm text-[#6B7280]">
        No posts yet. Be the first to start a discussion.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <MasaiverseDiscussionPostCard
          key={post.id}
          profileImage={post.authorProfileImage ?? getFallbackAvatar(post.authorName)}
          name={post.authorName}
          createdAt={formatTimestamp(post.createdAt)}
          content={post.content}
          currentUpvoteCount={post.upvotes}
          currentDownvoteCount={post.downvotes}
          voteDirection={
            post.myVote === 'upvote'
              ? 'up'
              : post.myVote === 'downvote'
                ? 'down'
                : null
          }
          onUpvoteClick={() => {
            void onVotePost(post.id, 'upvote')
          }}
          onDownvoteClick={() => {
            void onVotePost(post.id, 'downvote')
          }}
          onVoteReply={onVoteReply}
          initialBookmarked={post.isBookmarked}
          onBookmarkToggle={async () => {
            await onToggleBookmark(post.id)
          }}
          replies={mapReplies(post)}
          replyText={replyDrafts[post.id] ?? ''}
          onReplyTextChange={(value) =>
            setReplyDrafts((prev) => ({
              ...prev,
              [post.id]: value,
            }))
          }
          onReplySubmit={() => {
            const content = (replyDrafts[post.id] ?? '').trim()
            if (!content) {
              return
            }
            void onReply(post.id, content).then(() => {
              setReplyDrafts((prev) => ({
                ...prev,
                [post.id]: '',
              }))
            })
          }}
        />
      ))}
    </div>
  )
}

export default DiscussionsList
