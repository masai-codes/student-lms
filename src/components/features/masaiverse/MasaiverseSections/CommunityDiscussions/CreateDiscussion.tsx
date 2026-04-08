import { useState } from 'react'
import { DiscussionPostCardComposer } from '@/components/discussion-post-card'

type CreateDiscussionProps = {
  onCreate: (content: string) => Promise<void>
  isSubmitting: boolean
}

const CreateDiscussion = ({
  onCreate,
  isSubmitting,
}: CreateDiscussionProps) => {
  const [content, setContent] = useState('')

  const handleSubmit = async () => {
    const trimmed = content.trim()
    if (!trimmed || isSubmitting) return
    await onCreate(trimmed)
    setContent('')
  }

  return (
    <DiscussionPostCardComposer
      replyText={content}
      onReplyTextChange={setContent}
      onReplySubmit={() => {
        void handleSubmit()
      }}
    />
  )
}

export default CreateDiscussion
