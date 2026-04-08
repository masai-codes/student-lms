import { useState } from 'react'
import type { DiscussionPost } from '@/server/masaiverse/communityDiscussions'

type DiscussionsListProps = {
  posts: Array<DiscussionPost>
  onVotePost: (postId: string, vote: 'upvote' | 'downvote') => Promise<void>
  onVoteReply: (replyId: string, vote: 'upvote' | 'downvote') => Promise<void>
  onReply: (postId: string, content: string) => Promise<void>
}

const DiscussionsList = ({
  posts,
  onVotePost,
  onVoteReply,
  onReply,
}: DiscussionsListProps) => {
  const [replyDrafts, setReplyDrafts] = useState<Partial<Record<string, string>>>({})

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
        <div key={post.id} className="rounded-lg border border-[#E5E7EB] bg-white p-4">
          <p className="text-sm font-medium text-[#111827]">{post.authorName}</p>
          <p className="mt-2 text-sm text-[#374151]">{post.content}</p>
          <div className="mt-3 flex items-center gap-3 text-sm">
            <button
              type="button"
              className="rounded border px-2 py-1 hover:bg-[#F3F4F6]"
              onClick={() => {
                void onVotePost(post.id, 'upvote')
              }}
            >
              Upvote ({post.upvotes})
            </button>
            <button
              type="button"
              className="rounded border px-2 py-1 hover:bg-[#F3F4F6]"
              onClick={() => {
                void onVotePost(post.id, 'downvote')
              }}
            >
              Downvote ({post.downvotes})
            </button>
          </div>

          <div className="mt-3">
            <textarea
              value={replyDrafts[post.id] ?? ''}
              onChange={(event) =>
                setReplyDrafts((prev) => ({
                  ...prev,
                  [post.id]: event.target.value,
                }))
              }
              placeholder="Write a reply..."
              className="min-h-[70px] w-full rounded-md border border-[#D1D5DB] p-2 text-sm"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                className="rounded-md bg-[#7A74B6] px-3 py-1 text-sm text-white disabled:opacity-50"
                disabled={!replyDrafts[post.id]?.trim()}
                onClick={() => {
                  const content = (replyDrafts[post.id] ?? '').trim()
                  if (!content) return
                  void onReply(post.id, content).then(() => {
                    setReplyDrafts((prev) => ({
                      ...prev,
                      [post.id]: '',
                    }))
                  })
                }}
              >
                Reply
              </button>
            </div>
          </div>

          {post.replies.length > 0 ? (
            <div className="mt-4 space-y-2 rounded-md bg-[#F9FAFB] p-3">
              {post.replies.map((reply) => (
                <div key={reply.id} className="rounded border border-[#E5E7EB] bg-white p-3">
                  <p className="text-xs font-medium text-[#111827]">{reply.authorName}</p>
                  <p className="mt-1 text-sm text-[#374151]">{reply.content}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs">
                    <button
                      type="button"
                      className="rounded border px-2 py-1 hover:bg-[#F3F4F6]"
                      onClick={() => {
                        void onVoteReply(reply.id, 'upvote')
                      }}
                    >
                      Upvote ({reply.upvotes})
                    </button>
                    <button
                      type="button"
                      className="rounded border px-2 py-1 hover:bg-[#F3F4F6]"
                      onClick={() => {
                        void onVoteReply(reply.id, 'downvote')
                      }}
                    >
                      Downvote ({reply.downvotes})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}

export default DiscussionsList
