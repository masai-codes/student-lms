'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'

import { applyThemeToDocument, readStoredTheme } from './apply'
import { DEFAULT_THEME_ID, STORAGE_KEY, THEMES, getTheme } from './themes'
import type { ThemeDefinition, ThemeId } from './themes'

interface ThemeContextValue {
  /** Currently active theme id. */
  theme: ThemeId
  /** Full definition of the active theme. */
  themeDefinition: ThemeDefinition
  /** All registered themes, in display order. */
  themes: Array<ThemeDefinition>
  /** Switch theme: updates <html>, persists to localStorage. */
  setTheme: (id: ThemeId) => void
  /**
   * True once the client has mounted and reconciled with localStorage. Use to
   * avoid rendering theme-dependent UI (e.g. the active check in the switcher)
   * during SSR, which would otherwise hydrate mismatched.
   */
  hydrated: boolean
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  // SSR renders the default; the pre-hydration inline script has already set the
  // real theme on <html>, and the effect below reconciles React state to it.
  const [theme, setThemeState] = useState<ThemeId>(DEFAULT_THEME_ID)
  const [hydrated, setHydrated] = useState(false)
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const stored = readStoredTheme(STORAGE_KEY)
    setThemeState(stored)
    // The inline script already applied it, but re-apply to be certain the
    // classList/attribute match React's notion of the active theme.
    applyThemeToDocument(stored)
    setHydrated(true)
  }, [])

  // Keep in sync across tabs.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY) return
      const next = readStoredTheme(STORAGE_KEY)
      setThemeState(next)
      applyThemeToDocument(next)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const setTheme = useCallback((id: ThemeId) => {
    setThemeState(id)
    try {
      window.localStorage.setItem(STORAGE_KEY, id)
    } catch {
      // Ignore persistence failures (private mode, quota) — theme still applies.
    }

    // Enable the color-transition only for the duration of the switch, so the
    // fade plays on switch but never interferes with normal interactions.
    const root = document.documentElement
    root.setAttribute('data-theme-transition', '')
    applyThemeToDocument(id)
    if (transitionTimer.current) clearTimeout(transitionTimer.current)
    transitionTimer.current = setTimeout(() => {
      root.removeAttribute('data-theme-transition')
    }, 400)
  }, [])

  const value: ThemeContextValue = {
    theme,
    themeDefinition: getTheme(theme),
    themes: THEMES,
    setTheme,
    hydrated,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within a <ThemeProvider>')
  }
  return ctx
}
