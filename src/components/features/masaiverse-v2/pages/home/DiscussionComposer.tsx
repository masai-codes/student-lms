import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { RichTextEditor } from '@/components/discussion-post-card'
import { createMasaiverseV2Discussion } from '@/lib/api/masaiverse-v2/masaiverseV2Api'
import { parseTagsInput } from '@/lib/discussionTags'
import { htmlPlainText } from '@/lib/html'
import { MASAIVERSE_V2_DISCUSSIONS_KEY } from '@/query/masaiverse-v2/discussionsQuery'

type DiscussionComposerProps = {
  onClose: () => void
}

export default function DiscussionComposer({
  onClose,
}: DiscussionComposerProps) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tagsInput, setTagsInput] = useState('')

  const mutation = useMutation({
    mutationFn: createMasaiverseV2Discussion,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: MASAIVERSE_V2_DISCUSSIONS_KEY,
      })
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
        className="mb-3 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-[15px] font-semibold text-[#111827] outline-none placeholder:font-normal placeholder:text-[#9CA3AF]"
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
        className="mt-3 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-[14px] text-[#111827] outline-none placeholder:text-[#9CA3AF]"
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
