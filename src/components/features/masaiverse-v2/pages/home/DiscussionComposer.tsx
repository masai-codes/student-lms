import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { RichTextEditor } from '@/components/discussion-post-card'
import { createMasaiverseV2Discussion } from '@/lib/api/masaiverse-v2/masaiverseV2Api'
import { parseTagsInput } from '@/lib/discussionTags'
import { htmlPlainText } from '@/lib/html'
import { MASAIVERSE_V2_DISCUSSIONS_KEY } from '@/query/masaiverse-v2/discussionsQuery'
import { MASAIVERSE_V2_HOME_KEY } from '@/query/masaiverse-v2/homeQuery'
import { masaiverseV2ClubDetailQuery } from '@/query/masaiverse-v2/clubsQuery'
import { invalidateMasaiverseV2Leaderboards } from '@/query/masaiverse-v2/leaderboardQuery'

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
      className="rounded-[14px] border border-[#EDEAE8] bg-white p-4"
    >
      <input
        type="text"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Discussion title"
        maxLength={255}
        className="mb-3 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-[16px] font-semibold text-[#111827] outline-none placeholder:font-normal placeholder:text-[#9CA3AF] sm:text-[15px]"
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
        className="mt-3 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-[16px] text-[#111827] outline-none placeholder:text-[#9CA3AF] sm:text-[14px]"
      />
      {mutation.isError ? (
        <p className="mt-2 text-[13px] text-[#DC2626]">
          Could not post your discussion. Please try again.
        </p>
      ) : null}
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-[14px] font-medium text-[#6B7280] hover:bg-[#F3F0EE]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-lg bg-masaiverse-orange px-4 py-2 text-[14px] font-semibold text-white hover:bg-masaiverse-orange-dark disabled:opacity-50"
        >
          {mutation.isPending ? 'Posting…' : 'Post'}
        </button>
      </div>
    </form>
  )
}
