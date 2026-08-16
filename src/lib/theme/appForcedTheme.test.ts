import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  forceLightTheme,
  isAppShell,
  isForcedLightPath,
  shouldForceLightTheme,
} from '@/lib/theme/appForcedTheme'
import { buildThemeInitScript } from '@/lib/theme/theme-script'
import { STORAGE_KEY } from '@/lib/theme/themes'

class MemoryStorage implements Storage {
  private map = new Map<string, string>()
  get length() {
    return this.map.size
  }
  clear() {
    this.map.clear()
  }
  getItem(key: string): string | null {
    return this.map.get(key) ?? null
  }
  key(index: number): string | null {
    return Array.from(this.map.keys())[index] ?? null
  }
  removeItem(key: string): void {
    this.map.delete(key)
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value)
  }
}

type StubOptions = {
  search?: string
  pathname?: string
  isApp?: boolean
  sessionAppFlag?: string
}

function stubWindow({
  search = '',
  pathname = '/',
  isApp,
  sessionAppFlag,
}: StubOptions = {}) {
  const localStorage = new MemoryStorage()
  const sessionStorage = new MemoryStorage()
  if (sessionAppFlag !== undefined) {
    sessionStorage.setItem('lms.appMobile', sessionAppFlag)
  }
  vi.stubGlobal('window', {
    localStorage,
    sessionStorage,
    location: { search, pathname },
    ...(isApp === undefined ? {} : { isApp }),
  })
  return { localStorage, sessionStorage }
}

describe('isAppShell', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('detects ?isApp=true on the current URL', () => {
    stubWindow({ search: '?isApp=true' })
    expect(isAppShell()).toBe(true)
  })

  it('accepts isApp=1 and is case-insensitive', () => {
    stubWindow()
    expect(isAppShell('?isApp=1')).toBe(true)
    expect(isAppShell('?isApp=TRUE')).toBe(true)
  })

  it('detects window.isApp when no param is present', () => {
    stubWindow({ isApp: true })
    expect(isAppShell()).toBe(true)
  })

  it('falls back to the persisted session flag', () => {
    stubWindow({ sessionAppFlag: 'true' })
    expect(isAppShell()).toBe(true)
  })

  it('lets an explicit isApp=false win over a stale session flag', () => {
    stubWindow({ search: '?isApp=false', sessionAppFlag: 'true' })
    expect(isAppShell()).toBe(false)
  })

  it('is false for plain browser traffic', () => {
    stubWindow({ search: '?foo=bar' })
    expect(isAppShell()).toBe(false)
  })
})

describe('isForcedLightPath', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('matches the notes-preview routes', () => {
    expect(isForcedLightPath('/notes-preview-v2')).toBe(true)
    expect(isForcedLightPath('/notes-preview')).toBe(true)
  })

  it('does not match other routes', () => {
    expect(isForcedLightPath('/')).toBe(false)
    expect(isForcedLightPath('/learn/notes-preview-v2')).toBe(false)
  })

  it('reads the current pathname when none is given', () => {
    stubWindow({ pathname: '/notes-preview-v2' })
    expect(isForcedLightPath()).toBe(true)
  })
})

describe('shouldForceLightTheme', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('forces light on notes-preview even without isApp', () => {
    stubWindow({ pathname: '/notes-preview-v2' })
    expect(shouldForceLightTheme()).toBe(true)
  })

  it('forces light on notes-preview when isApp is explicitly false', () => {
    stubWindow({ pathname: '/notes-preview-v2', search: '?isApp=false' })
    expect(shouldForceLightTheme()).toBe(true)
  })

  it('leaves a normal browser page alone', () => {
    stubWindow({ pathname: '/learn' })
    expect(shouldForceLightTheme()).toBe(false)
  })
})

describe('forceLightTheme', () => {
  beforeEach(() => {
    vi.stubGlobal('document', undefined)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('overwrites a stored dark pin when persisting (app shell)', () => {
    const { localStorage } = stubWindow({ search: '?isApp=true' })
    localStorage.setItem(STORAGE_KEY, 'dark')

    forceLightTheme({ persist: true })

    expect(localStorage.getItem(STORAGE_KEY)).toBe('light')
  })

  it('leaves the stored preference untouched when not persisting (route)', () => {
    const { localStorage } = stubWindow({ pathname: '/notes-preview-v2' })
    localStorage.setItem(STORAGE_KEY, 'dark')

    forceLightTheme({ persist: false })

    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark')
  })
})

describe('buildThemeInitScript', () => {
  it('pins light before paint and mirrors isAppShell inputs', () => {
    const script = buildThemeInitScript()

    // Keep the pre-paint script in lockstep with `shouldForceLightTheme`.
    expect(script).toContain('"isApp"')
    expect(script).toContain('"lms.appMobile"')
    expect(script).toContain('"/notes-preview"')
    expect(script).toContain("localStorage.setItem(KEY,'light')")
  })
})
