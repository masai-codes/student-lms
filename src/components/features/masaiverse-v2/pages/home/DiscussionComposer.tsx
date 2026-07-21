import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { RichTextEditor } from '@/components/discussion-post-card'
import { createMasaiverseV2Discussion } from '@/lib/api/masaiverse-v2/masaiverseV2Api'
import { parseTagsInput } from '@/lib/discussionTags'
import { htmlPlainText } from '@/lib/html'
import { MASAIVERSE_V2_DISCUSSIONS_KEY } from '@/query/masaiverse-v2/discussionsQuery'
import { MASAIVERSE_V2_HOME_KEY } from '@/query/masaiverse-v2/homeQuery'
import {
  masaiverseV2ClubDetailQuery,
  masaiverseV2ClubStatsQuery,
} from '@/query/masaiverse-v2/clubsQuery'
import { invalidateMasaiverseV2Leaderboards } from '@/query/masaiverse-v2/leaderboardQuery'
import { MASAIVERSE_EVENTS, trackMasaiverse } from '../../tracking'

type DiscussionComposerProps = {
  onClose: () => void
  /** When set, the new post is scoped to this club instead of the community. */
  clubId?: string
}

export default function DiscussionComposer({
  onClose,
  clubId,
}: DiscussionComposerProps) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tagsInput, setTagsInput] = useState('')

  const mutation = useMutation({
    mutationFn: createMasaiverseV2Discussion,
    onSuccess: () => {
      trackMasaiverse(MASAIVERSE_EVENTS.discussionCreate, { club_id: clubId })
      // The standalone, paginated feed reads from the discussions query…
      void queryClient.invalidateQueries({
        queryKey: MASAIVERSE_V2_DISCUSSIONS_KEY,
      })
      // …while the home and club detail pages now embed the latest discussions
      // in their own payloads, so refresh those too.
      void queryClient.invalidateQueries({ queryKey: MASAIVERSE_V2_HOME_KEY })
      if (clubId) {
        void queryClient.invalidateQueries({
          queryKey: masaiverseV2ClubDetailQuery(clubId).queryKey,
          exact: true,
        })
        // The stats header reads from a separate query; the new post bumps its
        // communityPosts count, so refresh it too.
        void queryClient.invalidateQueries({
          queryKey: masaiverseV2ClubStatsQuery(clubId).queryKey,
          exact: true,
        })
      }
      // Creating a post awards leaderboard points, so refresh the standings.
      invalidateMasaiverseV2Leaderboards(queryClient)
      onClose()
    },
  })

  const canSubmit =
    title.trim().length > 0 &&
    htmlPlainText(content).length > 0 &&
    !mutation.isPending

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (canSubmit) {
          mutation.mutate({
            title: title.trim(),
            content,
            tags: parseTagsInput(tagsInput),
            ...(clubId ? { clubId } : {}),
          })
        }
      }}
      className="rounded-[14px] border border-border bg-surface p-4"
    >
      <input
        type="text"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Discussion title"
        maxLength={255}
        className="mb-3 w-full rounded-lg border border-border px-3 py-2 text-[16px] font-semibold text-foreground outline-none placeholder:font-normal placeholder:text-foreground-subtle sm:text-[15px]"
      />
      <RichTextEditor
        value={content}
        onChange={setContent}
        placeholder="Share something with the community…"
      />
      <input
        type="text"
        value={tagsInput}
        onChange={(event) => setTagsInput(event.target.value)}
        placeholder="Add tags, comma separated (e.g. Career, Interviews)"
        className="mt-3 w-full rounded-lg border border-border px-3 py-2 text-[16px] text-foreground outline-none placeholder:text-foreground-subtle sm:text-[14px]"
      />
      {mutation.isError ? (
        <p className="mt-2 text-[13px] text-danger">
          Could not post your discussion. Please try again.
        </p>
      ) : null}
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-[14px] font-medium text-foreground-muted hover:bg-surface-muted"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-lg bg-accent-warm px-4 py-2 text-[14px] font-semibold text-accent-warm-foreground hover:bg-accent-warm-hover disabled:opacity-50"
        >
          {mutation.isPending ? 'Posting…' : 'Post'}
        </button>
      </div>
    </form>
  )
}
