type LectureChatRole = 'user' | 'assistant'

type LectureChatMessageSource = 'history' | 'live-text' | 'live-voice'

export type LectureChatMessage = {
  id: string
  role: LectureChatRole
  content: string
  /** ms epoch */
  timestamp: number
  source: LectureChatMessageSource
}
