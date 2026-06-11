export type ChatMode = 'text' | 'voice'

export type MessageRole = 'user' | 'assistant'

export type ChatbotSessionSummary = {
  sessionId: string
  lectureId: number
  title: string
  lastMode: ChatMode
  createdAt: string
  updatedAt: string
}

export type StoredMessage = {
  id: string
  role: MessageRole
  content: string
  sourceType: string
  livekitId: string | null
  createdAt: string
}

