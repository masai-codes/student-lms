import { useState } from 'react'
import type { DiscussionReply as DiscussionPostCardReply } from '@/components/discussion-post-card'
import { formatSocialPostTime } from '@/lib/socialRelativeTime'
import type {
  DiscussionEntityId,
  DiscussionPost,
} from '@/server/masaiverse/communityDiscussions'
import MasaiverseDiscussionPostCard from './MasaiverseDiscussionPostCard'

type DiscussionsListProps = {
  isAdmin: boolean
  posts: Array<DiscussionPost>
  onVotePost: (postId: DiscussionEntityId, vote: 'upvote' | 'downvote') => Promise<void>
  onVoteReply: (replyId: string, vote: 'upvote' | 'downvote') => Promise<void>
  onReply: (postId: DiscussionEntityId, content: string) => Promise<void>
  onToggleBookmark: (postId: DiscussionEntityId) => Promise<void>
  onTogglePostBan: (postId: DiscussionEntityId, shouldBan: boolean) => Promise<void>
  openPostId: string | null
  onPostDrawerOpenChange: (postId: string, open: boolean) => void
  onCreateDiscussionClick: () => void
}

const DiscussionsList = ({
  isAdmin,
  posts,
  onVotePost,
  onVoteReply,
  onReply,
  onToggleBookmark,
  onTogglePostBan,
  openPostId,
  onPostDrawerOpenChange,
  onCreateDiscussionClick,
}: DiscussionsListProps) => {
  const [replyDrafts, setReplyDrafts] = useState<Partial<Record<string, string>>>({})

  const getPostContentHtml = (title: string, content: string) => {
    if (title && content) {
      return `${title}<p><br /></p>${content}`
    }
    return title || content
  }

  const getFallbackAvatar = (name: string) => {
    const initials = name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('') || 'U'

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72"><rect width="100%" height="100%" fill="#F3F4F6"/><text x="50%" y="50%" dy=".35em" text-anchor="middle" fill="#374151" font-family="Arial, sans-serif" font-size="28" font-weight="600">${initials}</text></svg>`
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  }

  const mapReplies = (post: DiscussionPost): Array<DiscussionPostCardReply> =>
    post.replies.map((reply) => ({
      id: String(reply.id),
      profileImage: reply.authorProfileImage ?? getFallbackAvatar(reply.authorName),
      author: reply.authorName,
      createdAt: formatSocialPostTime(reply.createdAt),
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
      <div className="rounded-lg border border-[#E5E7EB] bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[#6B7280]">
            No posts yet. Be the first to start a discussion.
          </p>
        <button
          type="button"
          onClick={onCreateDiscussionClick}
          className="shrink-0 rounded-md border border-[#EF8833] bg-[#FFF7ED] px-3 py-2 text-sm font-semibold text-[#C96B1E] hover:bg-[#FBE7D6]"
        >
          Create Discussion
        </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => {
        const postId = String(post.id)
        return (
          <div key={post.id} className="space-y-2">
            {isAdmin ? (
              <div className="flex justify-end gap-2">
                {post.isBanned ? (
                  <span className="rounded-md bg-[#FEE2E2] px-2 py-1 text-xs font-medium text-[#B91C1C]">
                    Banned
                  </span>
                ) : null}
                <button
                  type="button"
                  className={`rounded-md border px-2 py-1 text-xs font-medium ${
                    post.isBanned
                      ? 'border-[#16A34A] bg-[#ECFDF3] text-[#15803D] hover:bg-[#DCFCE7]'
                      : 'border-[#DC2626] bg-[#FEF2F2] text-[#B91C1C] hover:bg-[#FEE2E2]'
                  }`}
                  onClick={() => {
                    void onTogglePostBan(post.id, !post.isBanned)
                  }}
                >
                  {post.isBanned ? 'Remove Ban' : 'Ban Post'}
                </button>
              </div>
            ) : null}
            <MasaiverseDiscussionPostCard
              profileImage={post.authorProfileImage ?? getFallbackAvatar(post.authorName)}
              name={post.authorName}
              createdAt={formatSocialPostTime(post.createdAt)}
              content={getPostContentHtml(post.title, post.content)}
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
              replyText={replyDrafts[postId] ?? ''}
              onReplyTextChange={(value) =>
                setReplyDrafts((prev) => ({
                  ...prev,
                  [postId]: value,
                }))
              }
              onReplySubmit={() => {
                const content = (replyDrafts[postId] ?? '').trim()
                if (!content) {
                  return
                }
                void onReply(post.id, content).then(() => {
                  setReplyDrafts((prev) => ({
                    ...prev,
                    [postId]: '',
                  }))
                })
              }}
              open={openPostId === postId}
              onOpenChange={(open) => onPostDrawerOpenChange(postId, open)}
            />
          </div>
        )
      })}
    </div>
  )
}

export default DiscussionsList
