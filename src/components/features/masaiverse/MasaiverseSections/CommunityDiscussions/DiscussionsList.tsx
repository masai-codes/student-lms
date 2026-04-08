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
  onVoteReply: _onVoteReply,
  onReply,
  onToggleBookmark,
}: DiscussionsListProps) => {
  const [replyDrafts, setReplyDrafts] = useState<Partial<Record<string, string>>>({})
  const defaultProfileImage =
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'

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
      author: reply.authorName,
      createdAt: formatTimestamp(reply.createdAt),
      content: reply.content,
      currentUpvoteCount: reply.upvotes,
      currentDownvoteCount: reply.downvotes,
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
          profileImage={defaultProfileImage}
          name={post.authorName}
          createdAt={formatTimestamp(post.createdAt)}
          content={post.content}
          currentUpvoteCount={post.upvotes}
          currentDownvoteCount={post.downvotes}
          onUpvoteClick={() => {
            void onVotePost(post.id, 'upvote')
          }}
          onDownvoteClick={() => {
            void onVotePost(post.id, 'downvote')
          }}
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
