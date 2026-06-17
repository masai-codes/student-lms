'use client'

import { createContext, useContext, type ReactNode } from 'react'

export type LectureSplitChatContextValue = {
  isOpen: boolean
  open: () => void
  close: () => void
}

const LectureSplitChatContext = createContext<LectureSplitChatContextValue | null>(
  null,
)

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
