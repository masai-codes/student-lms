'use client'

import { createContext, useContext, type ReactNode } from 'react'

export type LectureSqlPlaygroundContextValue = {
  isOpen: boolean
  /** The `sqlSandbox` entry to highlight (e.g. the one that triggered the nudge), or null. */
  highlightedEntryId: number | null
  /** Opens the drawer, optionally highlighting one instructor query. */
  open: (entryId?: number) => void
  close: () => void
}

const LectureSqlPlaygroundContext =
  createContext<LectureSqlPlaygroundContextValue | null>(null)

type LectureSqlPlaygroundProviderProps = {
  value: LectureSqlPlaygroundContextValue
  children: ReactNode
}

export function LectureSqlPlaygroundProvider({
  value,
  children,
}: LectureSqlPlaygroundProviderProps) {
  return (
    <LectureSqlPlaygroundContext.Provider value={value}>
      {children}
    </LectureSqlPlaygroundContext.Provider>
  )
}

export function useLectureSqlPlaygroundOptional(): LectureSqlPlaygroundContextValue | null {
  return useContext(LectureSqlPlaygroundContext)
}
