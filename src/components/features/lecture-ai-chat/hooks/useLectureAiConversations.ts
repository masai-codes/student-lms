'use client'

import { useQuery } from '@tanstack/react-query'

import { listAiTutorConversations } from '@/lib/api/ai-tutor/aiTutorChatApi'

/** Shared React Query key so the streaming hook can invalidate the list. */
export function lectureAiConversationsKey(lectureId: number) {
  return ['lectureAiConversations', lectureId] as const
}

/**
 * Conversation-history list for a lecture. Only fetched while the history panel
 * is open (`enabled`), and invalidated by `useLectureAiChat` after each
 * completed stream so freshly created threads appear.
 */
export function useLectureAiConversations(lectureId: number, enabled: boolean) {
  return useQuery({
    queryKey: lectureAiConversationsKey(lectureId),
    queryFn: () => listAiTutorConversations(lectureId),
    enabled,
    staleTime: 2 * 60 * 1000,
  })
}
