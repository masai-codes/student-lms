import { ArrowDown, ArrowUp } from '@phosphor-icons/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { DiscussionVote } from '@/server/api/masaiverse-v2/services/getCommunityDiscussions.service'
import type { DiscussionVoteState } from '@/server/api/masaiverse-v2/services/voteCommunityDiscussion.service'
import { invalidateMasaiverseV2Leaderboards } from '@/query/masaiverse-v2/leaderboardQuery'
import { MASAIVERSE_EVENTS, trackMasaiverse } from '../../tracking'

type DiscussionVotesProps = {
  upvotes: number
  myVote: DiscussionVote | null
  /** Casts a vote (post or reply) and resolves with the new state. */
  onVote: (value: DiscussionVote) => Promise<DiscussionVoteState>
  /** Called with the new state so the parent can update its cache. */
  onVoted: (state: DiscussionVoteState) => void
  /** What is being voted on, for GA funnel tracking. */
  target: 'post' | 'reply'
  /** Id of the post/reply being voted on, for GA funnel tracking. */
  targetId: string
}

export default function DiscussionVotes({
  upvotes,
  myVote,
  onVote,
  onVoted,
  target,
  targetId,
}: DiscussionVotesProps) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: onVote,
    onSuccess: (state) => {
      onVoted(state)
      // Voting awards/revokes points for voter and target owner; refresh standings.
      invalidateMasaiverseV2Leaderboards(queryClient)
    },
  })

  const isUp = myVote === 'upvote'
  const isDown = myVote === 'downvote'

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label="Upvote"
        aria-pressed={isUp}
        disabled={mutation.isPending}
        onClick={() => {
          trackMasaiverse(MASAIVERSE_EVENTS.discussionVote, {
            vote: 'upvote',
            target,
            target_id: targetId,
          })
          mutation.mutate('upvote')
        }}
        className={isUp ? 'text-masaiverse-orange' : 'text-[#9CA3AF] hover:text-masaiverse-orange'}
      >
        <ArrowUp size={18} weight={isUp ? 'fill' : 'bold'} />
      </button>
      <span
        className={`text-[14px] font-bold ${isUp ? 'text-masaiverse-orange' : 'text-[#111827]'}`}
      >
        {upvotes}
      </span>
      <button
        type="button"
        aria-label="Downvote"
        aria-pressed={isDown}
        disabled={mutation.isPending}
        onClick={() => {
          trackMasaiverse(MASAIVERSE_EVENTS.discussionVote, {
            vote: 'downvote',
            target,
            target_id: targetId,
          })
          mutation.mutate('downvote')
        }}
        className={
          isDown ? 'text-[#2563EB]' : 'text-[#9CA3AF] hover:text-[#2563EB]'
        }
      >
        <ArrowDown size={18} weight={isDown ? 'fill' : 'bold'} />
      </button>
    </div>
  )
}
