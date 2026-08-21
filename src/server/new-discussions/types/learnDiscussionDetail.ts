import type { DiscussionAuthorPreview } from '@/server/learn/types'

export type LearnDiscussionThreadItem = {
  id: number
  message: string
  createdAt: string | null
  author: DiscussionAuthorPreview | null
  authorProfileImageUrl: string | null
}
