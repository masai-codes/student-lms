import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MASAIVERSE_EVENTS, trackMasaiverse } from '../../tracking'
import DiscussionContent from './DiscussionContent'
import DiscussionReplies from './DiscussionReplies'
import DiscussionTags from './DiscussionTags'
import DiscussionVotes from './DiscussionVotes'
import type { MasaiverseV2Discussion } from '@/server/api/masaiverse-v2/services/getCommunityDiscussions.service'
import {
  banMasaiverseV2Post,
  voteMasaiverseV2Discussion,
} from '@/lib/api/masaiverse-v2/masaiverseV2Api'
import { getInitials } from '@/lib/initials'
import { patchDiscussionInCache } from '@/query/masaiverse-v2/discussionsQuery'
import { masaiverseV2AdminModeQuery } from '@/query/masaiverse-v2/adminModeQuery'
import { formatSocialPostTime } from '@/lib/socialRelativeTime'
import { useServerTime } from '@/hooks/useServerTime'

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
  const { now } = useServerTime()
  const [showReplies, setShowReplies] = useState(false)
  const { data: adminMode } = useQuery(masaiverseV2AdminModeQuery())
  const canModerate = adminMode?.enabled ?? false

  const banMutation = useMutation({
    mutationFn: () =>
      banMasaiverseV2Post({
        postId: discussion.id,
        banned: !discussion.isBanned,
      }),
    onSuccess: (state) => {
      trackMasaiverse(MASAIVERSE_EVENTS.discussionPostBan, {
        post_id: discussion.id,
        banned: state.isBanned,
      })
      patchDiscussionInCache(queryClient, discussion.id, {
        isBanned: state.isBanned,
      })
    },
  })

  return (
    <div
      className={`border-b border-border py-4 last:border-b-0 ${
        discussion.isBanned ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
          style={{ backgroundColor: accentColor }}
        >
          {getInitials(discussion.authorName)}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-foreground-muted">
            <span className="font-semibold text-foreground">
              {discussion.authorName}
            </span>
            {' · '}
            {formatSocialPostTime(
              discussion.createdAt,
              new Date(now.valueOf()),
            )}
            {discussion.isBanned ? (
              <span className="ml-2 rounded-full bg-danger-subtle px-2 py-0.5 text-[11px] font-semibold text-danger">
                Banned
              </span>
            ) : null}
          </p>
          <p className="mt-1 text-[15px] font-bold leading-5 text-foreground">
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
              className="text-[12px] font-medium text-foreground-subtle hover:text-foreground"
            >
              {showReplies
                ? 'Hide replies'
                : `${discussion.replyCount} replies`}
            </button>
            {canModerate ? (
              <button
                type="button"
                disabled={banMutation.isPending}
                onClick={() => banMutation.mutate()}
                className="text-[12px] font-semibold text-danger hover:text-danger disabled:opacity-50"
              >
                {discussion.isBanned ? 'Unban' : 'Ban'}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {showReplies ? (
        <DiscussionReplies postId={discussion.id} clubId={clubId} />
      ) : null}
    </div>
  )
}
