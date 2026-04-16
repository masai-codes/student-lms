import { useEffect, useState } from 'react'
import { DiscussionPostCardComposer } from '@/components/discussion-post-card'

type CreateDiscussionProps = {
  onCreate: (content: string) => Promise<void>
  isSubmitting: boolean
  currentUserName: string
  currentUserProfileImage: string | null
}

const CreateDiscussion = ({
  onCreate,
  isSubmitting,
  currentUserName,
  currentUserProfileImage,
}: CreateDiscussionProps) => {
  const [content, setContent] = useState('')
  const [isDesktop, setIsDesktop] = useState(false)

  const getFallbackAvatar = (name: string) => {
    const initials =
      name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('') || 'U'

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72"><rect width="100%" height="100%" fill="#F3F4F6"/><text x="50%" y="50%" dy=".35em" text-anchor="middle" fill="#374151" font-family="Arial, sans-serif" font-size="28" font-weight="600">${initials}</text></svg>`
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  }

  const handleSubmit = async () => {
    const trimmed = content.trim()
    if (!trimmed || isSubmitting) return
    await onCreate(trimmed)
    setContent('')
  }

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)')
    const sync = () => setIsDesktop(mediaQuery.matches)
    sync()
    mediaQuery.addEventListener('change', sync)
    return () => mediaQuery.removeEventListener('change', sync)
  }, [])

  return (
    <DiscussionPostCardComposer
      profileImage={
        currentUserProfileImage ?? getFallbackAvatar(currentUserName)
      }
      replyText={content}
      onReplyTextChange={setContent}
      onReplySubmit={() => {
        void handleSubmit()
      }}
      placeholder={
        isDesktop
          ? 'Share your thoughts with the community'
          : 'Share your thoughts'
      }
    />
  )
}

export default CreateDiscussion
