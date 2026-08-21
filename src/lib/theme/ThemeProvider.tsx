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
  APP_FORCED_PREFERENCE,
  forceLightTheme,
  isAppShell,
  isForcedLightPath,
} from './appForcedTheme'
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
  /**
   * True while the theme is pinned to light — the native app shell, or a
   * forced-light route (see `useForcedLightTheme`). Every setter is a no-op, so
   * UI that offers a theme choice should hide itself.
   */
  themeLocked: boolean
  /**
   * Pin light for as long as the caller is mounted; the returned function
   * releases the pin. Ref-counted, so overlapping callers are safe. Prefer the
   * `useForcedLightTheme` hook over calling this directly.
   */
  acquireLightLock: () => () => void
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
  // Two independent reasons the theme can be pinned to light:
  //   • the native app shell — sticky for the tab, and persisted
  //   • forced-light routes  — ref-counted, released on unmount, never persisted
  const [appLocked, setAppLocked] = useState(false)
  const [routeLocks, setRouteLocks] = useState(0)
  const themeLocked = appLocked || routeLocks > 0
  // Ref mirrors, so the listeners/setters below read the live lock without being
  // re-registered, and so a lock taken during the effect phase is visible to
  // effects that run later in the same commit.
  const lockedRef = useRef(false)
  const appLockedRef = useRef(false)
  const routeLockCountRef = useRef(0)
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resolvedTheme = themeLocked
    ? APP_FORCED_PREFERENCE
    : resolveTheme(preference, systemTheme)

  useEffect(() => {
    lockedRef.current = themeLocked
    appLockedRef.current = appLocked
  }, [themeLocked, appLocked])

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

  const acquireLightLock = useCallback(() => {
    routeLockCountRef.current += 1
    lockedRef.current = true
    setRouteLocks(routeLockCountRef.current)
    forceLightTheme({ persist: appLockedRef.current })

    let released = false
    return () => {
      if (released) return
      released = true
      routeLockCountRef.current = Math.max(0, routeLockCountRef.current - 1)
      setRouteLocks(routeLockCountRef.current)
      if (routeLockCountRef.current > 0 || appLockedRef.current) return
      // Last route lock released and we're not in the app shell — hand the user
      // their real preference back (nothing was persisted while pinned).
      lockedRef.current = false
      const stored = readStoredPreference(STORAGE_KEY)
      setPreferenceState(stored)
      applyThemeToDocument(resolveTheme(stored, getSystemTheme()))
    }
  }, [])

  useEffect(() => {
    // App shell: overwrite whatever was stored (localStorage is shared with the
    // browser, where the user may have pinned dark) and pin light.
    const inAppShell = isAppShell()
    // First paint on a forced-light route: pin light WITHOUT persisting, so the
    // user's preference survives for the rest of the app. `useForcedLightTheme`
    // in the route component owns the lock and releases it on navigation away;
    // checking the path here only keeps this effect from painting the stored
    // dark theme, since child effects (the hook) run before this one.
    const pinned =
      inAppShell || isForcedLightPath() || routeLockCountRef.current > 0

    if (pinned) {
      lockedRef.current = true
      appLockedRef.current = inAppShell
      setAppLocked(inAppShell)
      setPreferenceState(
        inAppShell ? APP_FORCED_PREFERENCE : readStoredPreference(STORAGE_KEY),
      )
      setSystemTheme(getSystemTheme())
      forceLightTheme({ persist: inAppShell })
      setHydrated(true)
      return
    }

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
      if (lockedRef.current) return
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
      // Another tab changed the pin while we're pinned — re-assert light.
      if (lockedRef.current) {
        forceLightTheme({ persist: appLockedRef.current })
        return
      }
      const next = readStoredPreference(STORAGE_KEY)
      setPreferenceState(next)
      applyThemeToDocument(resolveTheme(next, getSystemTheme()))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const setPreference = useCallback(
    (next: ThemePreference) => {
      // Pinned: swallow the change and re-assert light. On a forced-light route
      // the stored preference is left alone, so `preference` still reports it.
      if (lockedRef.current) {
        if (appLockedRef.current) setPreferenceState(APP_FORCED_PREFERENCE)
        forceLightTheme({ persist: appLockedRef.current })
        return
      }
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
    const current = resolveTheme(
      readStoredPreference(STORAGE_KEY),
      getSystemTheme(),
    )
    setTheme(current === 'dark' ? 'light' : 'dark')
  }, [setTheme])

  const value: ThemeContextValue = {
    preference,
    resolvedTheme,
    setTheme,
    toggleTheme,
    setPreference,
    hydrated,
    themeLocked,
    acquireLightLock,
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

/**
 * Pin the page to light for as long as the calling component is mounted —
 * whatever the stored preference, the OS, or `isApp` say. Used by chrome-less
 * WebView pages (`/notes-preview-v2`) whose content is authored light-only. The
 * pin is not persisted, so navigating away restores the user's own theme.
 */
export function useForcedLightTheme(): void {
  const { acquireLightLock } = useTheme()
  useEffect(() => acquireLightLock(), [acquireLightLock])
}
