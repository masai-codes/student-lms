import { afterEach, describe, expect, it } from 'vitest'

import {
  CONNECT_SID_COOKIE_MAX_AGE_MS,
  buildMasaiLiveConnectSidCookie,
  decodeCookieValue,
  extractCookieValue,
  frontendHomeForRedirect,
  getMasaiLiveCookieDomain,
} from '@/server/api/user-auth/services/masaiLiveLoginCookies'

describe('masaiLiveLoginCookies', () => {
  afterEach(() => {
    delete process.env.FRONTEND_URL
    delete process.env.NODE_ENV
  })

  it('extracts a named cookie value from Set-Cookie headers', () => {
    expect(
      extractCookieValue(
        ['connect.sid=s%3Aabc; Path=/', 'other=1'],
        'connect.sid',
      ),
    ).toBe('s%3Aabc')
    expect(extractCookieValue(undefined, 'connect.sid')).toBeNull()
    expect(extractCookieValue(['foo=bar'], 'connect.sid')).toBeNull()
    expect(
      extractCookieValue(['connect.sid=; Path=/'], 'connect.sid'),
    ).toBeNull()
  })

  it('decodes URL-encoded cookie values and falls back on bad input', () => {
    expect(decodeCookieValue('s%3Aabc')).toBe('s:abc')
    expect(decodeCookieValue('%E0%A4%A')).toBe('%E0%A4%A')
  })

  it('resolves frontend home from FRONTEND_URL or defaults to /', () => {
    expect(frontendHomeForRedirect()).toBe('/')
    process.env.FRONTEND_URL = 'https://students.example.com/'
    expect(frontendHomeForRedirect()).toBe('https://students.example.com')
  })

  it('derives the shared cookie domain from the Masai Live host', () => {
    expect(getMasaiLiveCookieDomain()).toBe('.masaischool.com')
  })

  it('builds a secure connect.sid Set-Cookie header', () => {
    const header = buildMasaiLiveConnectSidCookie('s%3Araw')
    expect(header).toContain('connect.sid=s%3Araw')
    expect(header).toContain('Domain=.masaischool.com')
    expect(header).toContain('HttpOnly')
    expect(header).toContain('Secure')
    expect(header).toContain('SameSite=Lax')
    expect(header).toContain(
      `Max-Age=${Math.floor(CONNECT_SID_COOKIE_MAX_AGE_MS / 1000)}`,
    )
  })

  it('falls back by NODE_ENV when URL parsing fails', () => {
    const OriginalURL = globalThis.URL
    // Force the try-block to fail so the NODE_ENV fallback runs.
    class BrokenURL extends OriginalURL {
      constructor(url: string | URL, base?: string | URL) {
        super(url, base)
        throw new Error('boom')
      }
    }
    globalThis.URL = BrokenURL

    try {
      process.env.NODE_ENV = 'production'
      expect(getMasaiLiveCookieDomain()).toBe('.masaischool.com')
      process.env.NODE_ENV = 'development'
      expect(getMasaiLiveCookieDomain()).toBe('.iasam.dev')
    } finally {
      globalThis.URL = OriginalURL
      delete process.env.NODE_ENV
    }
  })
})
