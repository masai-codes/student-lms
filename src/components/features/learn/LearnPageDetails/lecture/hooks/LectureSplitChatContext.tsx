'use client'

import { createContext, useContext, type ReactNode } from 'react'

import type { UseLectureAiChatResult } from '@/components/features/lecture-ai-chat/hooks/useLectureAiChat'
import type { UseLectureAiChatFeedbackResult } from '@/components/features/lecture-ai-chat/hooks/useLectureAiChatFeedback'

export type LectureSplitChatContextValue = {
  isOpen: boolean
  open: () => void
  close: () => void
  /**
   * The single chat session shared by the inline and in-video fullscreen
   * panels. Owned by `LectureDesktopVideoStage` (which stays mounted across the
   * fullscreen toggle), so the conversation survives the panel swap instead of
   * each mount starting a fresh session.
   */
  chat: UseLectureAiChatResult
  feedback: UseLectureAiChatFeedbackResult
}

const LectureSplitChatContext =
  createContext<LectureSplitChatContextValue | null>(null)

type LectureSplitChatProviderProps = {
  value: LectureSplitChatContextValue
  children: ReactNode
}

export function LectureSplitChatProvider({
  value,
  children,
}: LectureSplitChatProviderProps) {
  return (
    <LectureSplitChatContext.Provider value={value}>
      {children}
    </LectureSplitChatContext.Provider>
  )
}

export function useLectureSplitChatOptional(): LectureSplitChatContextValue | null {
  return useContext(LectureSplitChatContext)
}
