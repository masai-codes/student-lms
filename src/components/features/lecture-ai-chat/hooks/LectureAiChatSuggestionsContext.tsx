'use client'

import { createContext, useContext, type ReactNode } from 'react'

import type { LectureAiChatSuggestion } from '@/server/learn/utils/buildLectureAiChatSuggestions'

const LectureAiChatSuggestionsContext = createContext<
  Array<LectureAiChatSuggestion>
>([])

type LectureAiChatSuggestionsProviderProps = {
  suggestions: Array<LectureAiChatSuggestion>
  children: ReactNode
}

export function LectureAiChatSuggestionsProvider({
  suggestions,
  children,
}: LectureAiChatSuggestionsProviderProps) {
  return (
    <LectureAiChatSuggestionsContext.Provider value={suggestions}>
      {children}
    </LectureAiChatSuggestionsContext.Provider>
  )
}

export function useLectureAiChatSuggestions(): Array<LectureAiChatSuggestion> {
  return useContext(LectureAiChatSuggestionsContext)
}
