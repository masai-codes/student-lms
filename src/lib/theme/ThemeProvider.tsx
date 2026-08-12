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

import {
  applyThemeToDocument,
  getSystemTheme,
  readStoredPreference,
} from './apply'
import {
  DEFAULT_PREFERENCE,
  STORAGE_KEY,
  preferenceForExplicitPick,
  resolveTheme,
} from './themes'
import type { ResolvedTheme, ThemePreference } from './themes'

interface ThemeContextValue {
  /** The persisted preference: `system`, `light`, or `dark`. */
  preference: ThemePreference
  /** The concrete theme currently on screen (`system` resolved). */
  resolvedTheme: ResolvedTheme
  /**
   * Explicitly pick a mode. Applies the collapse-to-system rule: picking the
   * mode the OS is already in persists `system`, so the app keeps following
   * future OS switches.
   */
  setTheme: (mode: ResolvedTheme) => void
  /** Flip between light and dark (same collapse-to-system persistence). */
  toggleTheme: () => void
  /** Persist a raw preference (used by settings UIs that expose `system`). */
  setPreference: (preference: ThemePreference) => void
  /**
   * True once the client has mounted and reconciled with localStorage. Use to
   * avoid rendering theme-dependent UI (e.g. the sun/moon toggle icon) during
   * SSR, which would otherwise hydrate mismatched.
   */
  hydrated: boolean
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function persistPreference(preference: ThemePreference) {
  try {
    window.localStorage.setItem(STORAGE_KEY, preference)
  } catch {
    // Ignore persistence failures (private mode, quota) — theme still applies.
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // SSR renders defaults; the pre-hydration inline script has already set the
  // real theme on <html>, and the mount effect reconciles React state to it.
  const [preference, setPreferenceState] =
    useState<ThemePreference>(DEFAULT_PREFERENCE)
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>('light')
  const [hydrated, setHydrated] = useState(false)
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resolvedTheme = resolveTheme(preference, systemTheme)

  /** Apply with a brief cross-fade (scoped to color properties in styles.css).
      The timer trails the 0.15s CSS duration slightly so the fade finishes
      before the transition rules are lifted. */
  const applyWithTransition = useCallback((theme: ResolvedTheme) => {
    const root = document.documentElement
    root.setAttribute('data-theme-transition', '')
    applyThemeToDocument(theme)
    if (transitionTimer.current) clearTimeout(transitionTimer.current)
    transitionTimer.current = setTimeout(() => {
      root.removeAttribute('data-theme-transition')
    }, 200)
  }, [])

  useEffect(() => {
    const stored = readStoredPreference(STORAGE_KEY)
    const system = getSystemTheme()
    setPreferenceState(stored)
    setSystemTheme(system)
    // The inline script already applied it, but re-apply to be certain the
    // classList/attribute match React's notion of the active theme.
    applyThemeToDocument(resolveTheme(stored, system))
    setHydrated(true)
  }, [])

  // Follow live OS switches while the preference is `system`.
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    function onChange(e: MediaQueryListEvent) {
      const system: ResolvedTheme = e.matches ? 'dark' : 'light'
      setSystemTheme(system)
      const stored = readStoredPreference(STORAGE_KEY)
      if (stored === 'system') applyWithTransition(system)
    }
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [applyWithTransition])

  // Keep in sync across tabs.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY) return
      const next = readStoredPreference(STORAGE_KEY)
      setPreferenceState(next)
      applyThemeToDocument(resolveTheme(next, getSystemTheme()))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const setPreference = useCallback(
    (next: ThemePreference) => {
      const system = getSystemTheme()
      setSystemTheme(system)
      setPreferenceState(next)
      persistPreference(next)
      applyWithTransition(resolveTheme(next, system))
    },
    [applyWithTransition],
  )

  const setTheme = useCallback(
    (mode: ResolvedTheme) => {
      setPreference(preferenceForExplicitPick(mode, getSystemTheme()))
    },
    [setPreference],
  )

  const toggleTheme = useCallback(() => {
    const current = resolveTheme(readStoredPreference(STORAGE_KEY), getSystemTheme())
    setTheme(current === 'dark' ? 'light' : 'dark')
  }, [setTheme])

  const value: ThemeContextValue = {
    preference,
    resolvedTheme,
    setTheme,
    toggleTheme,
    setPreference,
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
