import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MASAIVERSE_EVENTS, trackMasaiverse } from '../../tracking'
import DiscussionVotes from './DiscussionVotes'
import type { MasaiverseV2Reply } from '@/server/api/masaiverse-v2/services/getDiscussionReplies.service'
import {
  banMasaiverseV2Reply,
  createMasaiverseV2DiscussionReply,
  fetchMasaiverseV2DiscussionReplies,
  voteMasaiverseV2Reply,
} from '@/lib/api/masaiverse-v2/masaiverseV2Api'
import { getInitials } from '@/lib/initials'
import { incrementReplyCountInCache } from '@/query/masaiverse-v2/discussionsQuery'
import { masaiverseV2AdminModeQuery } from '@/query/masaiverse-v2/adminModeQuery'
import { masaiverseV2ClubStatsQuery } from '@/query/masaiverse-v2/clubsQuery'
import { MASAIVERSE_V2_HOME_KEY } from '@/query/masaiverse-v2/homeQuery'
import { invalidateMasaiverseV2Leaderboards } from '@/query/masaiverse-v2/leaderboardQuery'
import { formatSocialPostTime } from '@/lib/socialRelativeTime'
import { useServerTime } from '@/hooks/useServerTime'

type DiscussionRepliesProps = {
  postId: string
  /** When set, a new reply refreshes this club's stats count. */
  clubId?: string
}

export default function DiscussionReplies({
  postId,
  clubId,
}: DiscussionRepliesProps) {
  const queryClient = useQueryClient()
  const { now } = useServerTime()
  const [text, setText] = useState('')
  const repliesKey = ['masaiverse-v2', 'discussion-replies', postId]

  const repliesQuery = useQuery({
    queryKey: repliesKey,
    queryFn: () => fetchMasaiverseV2DiscussionReplies(postId),
  })

  const createMutation = useMutation({
    mutationFn: createMasaiverseV2DiscussionReply,
    onSuccess: () => {
      trackMasaiverse(MASAIVERSE_EVENTS.discussionReplyCreate, {
        post_id: postId,
      })
      setText('')
      void queryClient.invalidateQueries({ queryKey: repliesKey })
      incrementReplyCountInCache(queryClient, postId)
      // A reply counts toward the club's communityPosts stat, which lives in a
      // separate query from the feed, so refresh it on the club page.
      if (clubId) {
        void queryClient.invalidateQueries({
          queryKey: masaiverseV2ClubStatsQuery(clubId).queryKey,
          exact: true,
        })
      }
      // The home stats' "discussions this month" counts posts + replies, so a
      // new reply must refresh the home payload too.
      void queryClient.invalidateQueries({ queryKey: MASAIVERSE_V2_HOME_KEY })
      // Replying awards points to both replier and post author; refresh standings.
      invalidateMasaiverseV2Leaderboards(queryClient)
    },
  })

  const patchReply = (replyId: string, patch: Partial<MasaiverseV2Reply>) => {
    queryClient.setQueryData<Array<MasaiverseV2Reply>>(repliesKey, (prev) =>
      prev
        ? prev.map((r) => (r.id === replyId ? { ...r, ...patch } : r))
        : prev,
    )
  }

  const { data: adminMode } = useQuery(masaiverseV2AdminModeQuery())
  const canModerate = adminMode?.enabled ?? false

  const banMutation = useMutation({
    mutationFn: (vars: { replyId: string; banned: boolean }) =>
      banMasaiverseV2Reply({
        postId,
        replyId: vars.replyId,
        banned: vars.banned,
      }),
    onSuccess: (state) => {
      trackMasaiverse(MASAIVERSE_EVENTS.discussionReplyBan, {
        post_id: postId,
        reply_id: state.replyId,
        banned: state.isBanned,
      })
      if (state.replyId) patchReply(state.replyId, { isBanned: state.isBanned })
    },
  })

  const canPost = text.trim().length > 0 && !createMutation.isPending
  const replies = repliesQuery.data ?? []

  return (
    <div className="mt-3 rounded-[12px] bg-surface-muted p-3">
      <div className="flex gap-2">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Write a reply…"
          rows={2}
          className="flex-1 resize-y rounded-lg border border-border bg-surface px-3 py-2 text-[14px] text-foreground outline-none placeholder:text-foreground-subtle"
        />
        <button
          type="button"
          disabled={!canPost}
          onClick={() => {
            if (canPost) createMutation.mutate({ postId, content: text.trim() })
          }}
          className="h-fit self-end rounded-lg bg-accent-warm px-4 py-2 text-[14px] font-semibold text-accent-warm-foreground hover:bg-accent-warm-hover disabled:opacity-50"
        >
          Reply
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-3">
        {repliesQuery.isPending ? (
          <p className="text-[13px] text-foreground-muted">Loading replies…</p>
        ) : replies.length === 0 ? (
          <p className="text-[13px] text-foreground-muted">
            No replies yet. Be the first!
          </p>
        ) : (
          replies.map((reply) => (
            <div
              key={reply.id}
              className={`flex items-start gap-2 ${
                reply.isBanned ? 'opacity-60' : ''
              }`}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-muted text-[11px] font-bold text-foreground-muted">
                {getInitials(reply.authorName)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] text-foreground-muted">
                  <span className="font-semibold text-foreground">
                    {reply.authorName}
                  </span>
                  {' · '}
                  {formatSocialPostTime(
                    reply.createdAt,
                    new Date(now.valueOf()),
                  )}
                  {reply.isBanned ? (
                    <span className="ml-2 rounded-full bg-danger-subtle px-2 py-0.5 text-[10px] font-semibold text-danger">
                      Banned
                    </span>
                  ) : null}
                </p>
                <p className="whitespace-pre-wrap text-[14px] leading-5 text-foreground">
                  {reply.content}
                </p>
                {canModerate ? (
                  <button
                    type="button"
                    disabled={banMutation.isPending}
                    onClick={() =>
                      banMutation.mutate({
                        replyId: reply.id,
                        banned: !reply.isBanned,
                      })
                    }
                    className="mt-1 text-[11px] font-semibold text-danger hover:text-danger disabled:opacity-50"
                  >
                    {reply.isBanned ? 'Unban' : 'Ban'}
                  </button>
                ) : null}
              </div>
              <DiscussionVotes
                target="reply"
                targetId={reply.id}
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
