export type AiTutorSession = {
  sessionId: string
  roomName: string
  url: string
  token: string
  durationMinutes: number
  participantName: string
  uniqueId: string
}

export type AiTutorTranscriptEntry = {
  role: 'assistant' | 'user'
  content: string
  timestamp: string
  actionType: 'system-message' | 'user-message' | string
}

export type AiTutorTranscriptSession = {
  sessionId: string
  uniqueId: string
  transcript: Array<AiTutorTranscriptEntry>
  createdAt: string
}

export type AiTutorLimitStatus = {
  canProceed: boolean
  todayCount: number
  message: string
  lastSessionHasFeedback: boolean
}

export type AiTutorDispatchResult = {
  success: boolean
}
