import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveBadgeLandingBaseUrl } from '@/server/api/profile/badgeLandingUrl'

afterEach(() => vi.unstubAllEnvs())

describe('resolveBadgeLandingBaseUrl', () => {
  it('strips a trailing /graphql', () => {
    vi.stubEnv('EXPERIENCE_API_BASE_URL', 'https://api.example.com/graphql')
    expect(resolveBadgeLandingBaseUrl()).toBe('https://api.example.com')
  })

  it('strips a trailing /graphql/ with slash', () => {
    vi.stubEnv('EXPERIENCE_API_BASE_URL', 'https://api.example.com/graphql/')
    expect(resolveBadgeLandingBaseUrl()).toBe('https://api.example.com')
  })

  it('strips a bare trailing slash', () => {
    vi.stubEnv('EXPERIENCE_API_BASE_URL', 'https://api.example.com/')
    expect(resolveBadgeLandingBaseUrl()).toBe('https://api.example.com')
  })

  it('leaves a plain base URL alone', () => {
    vi.stubEnv('EXPERIENCE_API_BASE_URL', 'https://api.example.com')
    expect(resolveBadgeLandingBaseUrl()).toBe('https://api.example.com')
  })

  it('returns null when unconfigured', () => {
    vi.stubEnv('EXPERIENCE_API_BASE_URL', '')
    expect(resolveBadgeLandingBaseUrl()).toBeNull()
  })
})
