import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  captureAppMobileContextFromUrl,
  getAppMobileContext,
  withAppMobileHeaders,
} from '@/utils/appMobile'

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

describe('appMobile', () => {
  let storage: MemoryStorage

  beforeEach(() => {
    storage = new MemoryStorage()
    vi.stubGlobal('window', { sessionStorage: storage, location: { search: '' } })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('captureAppMobileContextFromUrl', () => {
    it('persists mobile context when isApp=true with platform=ios', () => {
      captureAppMobileContextFromUrl('?isApp=true&platform=ios')

      expect(getAppMobileContext()).toEqual({ isMobile: true, platform: 'ios' })
    })

    it('persists mobile context for android', () => {
      captureAppMobileContextFromUrl('?isApp=true&platform=android')

      expect(getAppMobileContext()).toEqual({ isMobile: true, platform: 'android' })
    })

    it('normalizes platform casing', () => {
      captureAppMobileContextFromUrl('?isApp=1&platform=IOS')

      expect(getAppMobileContext()).toEqual({ isMobile: true, platform: 'ios' })
    })

    it('ignores unknown platform values', () => {
      captureAppMobileContextFromUrl('?isApp=true&platform=windows')

      expect(getAppMobileContext()).toEqual({ isMobile: true, platform: null })
    })

    it('records isApp=false and clears prior platform', () => {
      captureAppMobileContextFromUrl('?isApp=true&platform=ios')
      expect(getAppMobileContext()).toEqual({ isMobile: true, platform: 'ios' })

      captureAppMobileContextFromUrl('?isApp=false')
      expect(getAppMobileContext()).toEqual({ isMobile: false, platform: null })
    })

    it('does nothing when isApp param is absent', () => {
      captureAppMobileContextFromUrl('?platform=ios')

      expect(getAppMobileContext()).toEqual({ isMobile: false, platform: null })
    })
  })

  describe('withAppMobileHeaders', () => {
    it('omits headers when not in mobile context', () => {
      const headers = withAppMobileHeaders({ 'Content-Type': 'application/json' })

      expect(headers.get('Content-Type')).toBe('application/json')
      expect(headers.get('X-App-Mobile')).toBeNull()
      expect(headers.get('X-App-Mobile-Platform')).toBeNull()
    })

    it('adds X-App-Mobile and X-App-Mobile-Platform when captured', () => {
      captureAppMobileContextFromUrl('?isApp=true&platform=android')

      const headers = withAppMobileHeaders({ 'Content-Type': 'application/json' })

      expect(headers.get('Content-Type')).toBe('application/json')
      expect(headers.get('X-App-Mobile')).toBe('true')
      expect(headers.get('X-App-Mobile-Platform')).toBe('android')
    })

    it('omits platform header when platform is unknown', () => {
      captureAppMobileContextFromUrl('?isApp=true')

      const headers = withAppMobileHeaders()

      expect(headers.get('X-App-Mobile')).toBe('true')
      expect(headers.get('X-App-Mobile-Platform')).toBeNull()
    })
  })
})
