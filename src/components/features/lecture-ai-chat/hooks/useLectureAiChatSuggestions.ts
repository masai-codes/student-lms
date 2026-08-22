'use client'

import { useQuery } from '@tanstack/react-query'

import { getLectureAiChatSuggestions } from '@/lib/api/cache/lectureAiChatSuggestionsApi'

/** Combined lecture-specific FAQs and fixed suggestions shown in the chat empty state. */
export function useLectureAiChatSuggestions(lectureId: number) {
  return useQuery({
    queryKey: ['lectureAiChatSuggestions', lectureId] as const,
    queryFn: () => getLectureAiChatSuggestions(lectureId),
    staleTime: 5 * 60 * 1000,
  })
}
