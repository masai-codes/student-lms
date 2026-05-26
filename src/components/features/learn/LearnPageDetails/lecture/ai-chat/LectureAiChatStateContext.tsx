'use client'

import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'

import type { UseLectureAiChatResult } from './hooks/useLectureAiChat'

/**
 * Shared state for the AI Tutor chat feature. Provided once per lecture so
 * sidebar (desktop) and dock (mobile) views share the same conversation,
 * messages and mic state.
 *
 * `null` means no provider is mounted yet (e.g. server render before
 * hydration). Consumers should treat that as "AI tutor not available right
 * now" and render a no-op placeholder.
 */
const LectureAiChatStateContext = createContext<UseLectureAiChatResult | null>(
  null,
)

type LectureAiChatStateProviderProps = {
  value: UseLectureAiChatResult
  children: ReactNode
}

export function LectureAiChatStateProvider({
  value,
  children,
}: LectureAiChatStateProviderProps) {
  return (
    <LectureAiChatStateContext.Provider value={value}>
      {children}
    </LectureAiChatStateContext.Provider>
  )
}

export function useLectureAiChatStateContext(): UseLectureAiChatResult | null {
  return useContext(LectureAiChatStateContext)
}
