'use client'

import { useQuery } from '@tanstack/react-query'

import { getLectureFaqs } from '@/lib/api/ai-tutor/aiTutorChatApi'

/** Lecture-specific FAQs (`lectures_ai.concepts.faqs`) shown in the chat empty state. */
export function useLectureAiChatFaqs(lectureId: number) {
  return useQuery({
    queryKey: ['lectureAiChatFaqs', lectureId] as const,
    queryFn: () => getLectureFaqs(lectureId),
    staleTime: 5 * 60 * 1000,
  })
}
