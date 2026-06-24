export type AiTutorConversationSummary = {
  chatId: number
  title: string
  updatedAt: string
}

export type ListAiTutorConversationsResponse = {
  conversations: Array<AiTutorConversationSummary>
}

export type AiTutorChatTurn = {
  role: 'user' | 'assistant'
  content: string
  createdAt?: number
}

export type GetAiTutorConversationResponse = {
  chatId: number
  chat: Array<AiTutorChatTurn>
}
