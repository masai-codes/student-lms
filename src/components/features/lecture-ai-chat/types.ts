export type LectureAiChatRole = 'user' | 'assistant'

export type LectureAiChatMessageStatus =
  | 'sent'
  | 'thinking'
  | 'streaming'
  | 'completed'
  | 'error'

export type LectureAiChatMessage = {
  id: string
  role: LectureAiChatRole
  content: string
  status: LectureAiChatMessageStatus
  /** Epoch ms — used only for stable ordering. */
  createdAt: number
}
