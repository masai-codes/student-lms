export type LectureChatRole = 'user' | 'assistant'

export type LectureChatMessageSource = 'history' | 'live-text' | 'live-voice'

export type LectureChatMessage = {
  id: string
  role: LectureChatRole
  content: string
  /** ms epoch */
  timestamp: number
  source: LectureChatMessageSource
}

export type AiTutorSessionState =
  'idle' | 'creating' | 'connecting' | 'connected' | 'ending' | 'error'
