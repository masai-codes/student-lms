import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import DiscussionContent from './DiscussionContent'
import DiscussionReplies from './DiscussionReplies'
import DiscussionTags from './DiscussionTags'
import DiscussionVotes from './DiscussionVotes'
import type { MasaiverseV2Discussion } from '@/server/api/masaiverse-v2/services/getCommunityDiscussions.service'
import { voteMasaiverseV2Discussion } from '@/lib/api/masaiverse-v2/masaiverseV2Api'
import { getInitials } from '@/lib/initials'
import { patchDiscussionInCache } from '@/query/masaiverse-v2/discussionsQuery'
import { formatSocialPostTime } from '@/lib/socialRelativeTime'
import { useServerTime } from '@/hooks/useServerTime'
import { MASAIVERSE_EVENTS, trackMasaiverse } from '../../tracking'

type DiscussionRowProps = {
  discussion: MasaiverseV2Discussion
  /** Avatar background color (hex). */
  accentColor: string
  /** When set, replies update this club's stats count. */
  clubId?: string
}

export default function DiscussionRow({
  discussion,
  accentColor,
  clubId,
}: DiscussionRowProps) {
  const queryClient = useQueryClient()
  const { now, skewMs } = useServerTime()
  const [showReplies, setShowReplies] = useState(false)

  return (
    <div className="border-b border-[#EDEAE8] py-4 last:border-b-0">
      <div className="flex items-start gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
          style={{ backgroundColor: accentColor }}
        >
          {getInitials(discussion.authorName)}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-[#6B7280]">
            <span className="font-semibold text-[#111827]">
              {discussion.authorName}
            </span>
            {' · '}
            {formatSocialPostTime(
              discussion.createdAt,
              new Date(now.valueOf()),
              skewMs,
            )}
          </p>
          <p className="mt-1 text-[15px] font-bold leading-5 text-[#111827]">
            {discussion.title}
          </p>
          <DiscussionContent html={discussion.content} />
          <DiscussionTags tags={discussion.tags} />

          <div className="mt-2 flex items-center gap-4">
            <DiscussionVotes
              target="post"
              targetId={discussion.id}
              upvotes={discussion.upvotes}
              myVote={discussion.myVote}
              onVote={(vote) =>
                voteMasaiverseV2Discussion({ postId: discussion.id, vote })
              }
              onVoted={(state) =>
                patchDiscussionInCache(queryClient, discussion.id, {
                  upvotes: state.upvotes,
                  myVote: state.myVote,
                })
              }
            />
            <button
              type="button"
              onClick={() => {
                trackMasaiverse(MASAIVERSE_EVENTS.discussionRepliesToggle, {
                  post_id: discussion.id,
                  open: !showReplies,
                })
                setShowReplies((open) => !open)
              }}
              className="text-[12px] font-medium text-[#9CA3AF] hover:text-[#111827]"
            >
              {showReplies ? 'Hide replies' : `${discussion.replyCount} replies`}
            </button>
          </div>
        </div>
      </div>

      {showReplies ? (
        <DiscussionReplies postId={discussion.id} clubId={clubId} />
      ) : null}
    </div>
  )
}
