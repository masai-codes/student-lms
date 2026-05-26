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

/**
 * One entry in the persisted `aiChatPracticeQuestions.chatHistory` JSON array.
 * Text chats use a single entry per completed turn (user + AI reply).
 * Voice chats use one entry per speaker turn so partial turns persist
 * cleanly even if the session ends mid-conversation.
 */
export type AiChatHistoryEntry =
  | AiChatTextTurnEntry
  | AiChatAudioStudentEntry
  | AiChatAudioAssistantEntry

export type AiChatTextTurnEntry = {
  type: 'text'
  userMessage: string
  aiMessage: string
  /** ms epoch — set when the OpenAI reply is persisted. */
  timestamp: number
}

export type AiChatAudioStudentEntry = {
  type: 'audio_chat_student_speaking'
  content: string
  /** ms epoch — derived from the LiveKit transcript timestamp. */
  timestamp: number
}

export type AiChatAudioAssistantEntry = {
  type: 'audio_chat_ai_response'
  content: string
  timestamp: number
}
