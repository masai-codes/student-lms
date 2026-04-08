import { useState } from 'react'

type CreateDiscussionProps = {
  onCreate: (content: string) => Promise<void>
  isSubmitting: boolean
}

const CreateDiscussion = ({ onCreate, isSubmitting }: CreateDiscussionProps) => {
  const [content, setContent] = useState('')

  const handleSubmit = async () => {
    const trimmed = content.trim()
    if (!trimmed || isSubmitting) return
    await onCreate(trimmed)
    setContent('')
  }

  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-white p-4">
      <p className="text-sm font-medium text-[#111827]">Create a post</p>
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Write your discussion post..."
        className="mt-3 min-h-[90px] w-full rounded-md border border-[#D1D5DB] p-3 text-sm text-[#111827] outline-none focus:border-[#7A74B6]"
      />
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={() => {
            void handleSubmit()
          }}
          disabled={isSubmitting || content.trim().length === 0}
          className="rounded-md bg-[#7A74B6] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Posting...' : 'Post'}
        </button>
      </div>
    </div>
  )
}

export default CreateDiscussion
