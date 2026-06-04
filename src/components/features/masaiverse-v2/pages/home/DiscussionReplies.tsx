import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import DiscussionVotes from './DiscussionVotes'
import type { MasaiverseV2Reply } from '@/server/api/masaiverse-v2/services/getDiscussionReplies.service'
import {
  createMasaiverseV2DiscussionReply,
  fetchMasaiverseV2DiscussionReplies,
  voteMasaiverseV2Reply,
} from '@/lib/api/masaiverse-v2/masaiverseV2Api'
import { getInitials } from '@/lib/initials'
import { incrementReplyCountInCache } from '@/query/masaiverse-v2/discussionsQuery'
import { formatSocialPostTime } from '@/lib/socialRelativeTime'

type DiscussionRepliesProps = {
  postId: string
}

export default function DiscussionReplies({ postId }: DiscussionRepliesProps) {
  const queryClient = useQueryClient()
  const [text, setText] = useState('')
  const repliesKey = ['masaiverse-v2', 'discussion-replies', postId]

  const repliesQuery = useQuery({
    queryKey: repliesKey,
    queryFn: () => fetchMasaiverseV2DiscussionReplies(postId),
  })

  const createMutation = useMutation({
    mutationFn: createMasaiverseV2DiscussionReply,
    onSuccess: () => {
      setText('')
      void queryClient.invalidateQueries({ queryKey: repliesKey })
      incrementReplyCountInCache(queryClient, postId)
    },
  })

  const patchReply = (replyId: string, patch: Partial<MasaiverseV2Reply>) => {
    queryClient.setQueryData<Array<MasaiverseV2Reply>>(repliesKey, (prev) =>
      prev
        ? prev.map((r) => (r.id === replyId ? { ...r, ...patch } : r))
        : prev,
    )
  }

  const canPost = text.trim().length > 0 && !createMutation.isPending
  const replies = repliesQuery.data ?? []

  return (
    <div className="mt-3 rounded-[12px] bg-[#FAF7F5] p-3">
      <div className="flex gap-2">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Write a reply…"
          rows={2}
          className="flex-1 resize-y rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-[14px] text-[#111827] outline-none placeholder:text-[#9CA3AF]"
        />
        <button
          type="button"
          disabled={!canPost}
          onClick={() => {
            if (canPost) createMutation.mutate({ postId, content: text.trim() })
          }}
          className="h-fit self-end rounded-lg bg-masaiverse-orange px-4 py-2 text-[14px] font-semibold text-white hover:bg-masaiverse-orange-dark disabled:opacity-50"
        >
          Reply
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-3">
        {repliesQuery.isPending ? (
          <p className="text-[13px] text-[#6B7280]">Loading replies…</p>
        ) : replies.length === 0 ? (
          <p className="text-[13px] text-[#6B7280]">
            No replies yet. Be the first!
          </p>
        ) : (
          replies.map((reply) => (
            <div key={reply.id} className="flex items-start gap-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#EDEAE8] text-[11px] font-bold text-[#6B7280]">
                {getInitials(reply.authorName)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] text-[#6B7280]">
                  <span className="font-semibold text-[#111827]">
                    {reply.authorName}
                  </span>
                  {' · '}
                  {formatSocialPostTime(reply.createdAt)}
                </p>
                <p className="whitespace-pre-wrap text-[14px] leading-5 text-[#111827]">
                  {reply.content}
                </p>
              </div>
              <DiscussionVotes
                upvotes={reply.upvotes}
                myVote={reply.myVote}
                onVote={(vote) =>
                  voteMasaiverseV2Reply({ replyId: reply.id, vote })
                }
                onVoted={(state) =>
                  patchReply(reply.id, {
                    upvotes: state.upvotes,
                    myVote: state.myVote,
                  })
                }
              />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
