export type AiChatRole = 'user' | 'assistant'

export type AiChatMessageSource = 'text' | 'voice'

export type AiChatMessage = {
  id: string
  role: AiChatRole
  content: string
  source: AiChatMessageSource
  /** ms epoch */
  timestamp: number
}

export type SendAiChatMessageResult = {
  userMessage: AiChatMessage
  assistantMessage: AiChatMessage
}
