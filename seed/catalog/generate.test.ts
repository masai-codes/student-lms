import { describe, expect, it } from 'vitest'

import { buildSecretLoginUrl, renderCatalogHtml } from './renderPage'
import type { CatalogSeedState } from './seedState'

const sampleState: CatalogSeedState = {
  'login-and-join-lecture': {
    seededAt: '2026-07-02T10:00:00.000Z',
    testUsers: [
      {
        role: 'admin',
        email: 'admin@example.com',
        password: 'password',
        userId: 1,
        name: 'Admin User',
      },
      {
        role: 'student',
        email: 'student@example.com',
        password: 'password',
        userId: 10005445,
        name: 'Student User',
      },
    ],
    timing: { lectureSchedule: '2026-07-02 10:00:00' },
    entityIds: { batchId: 10, sectionId: 20, lectureId: 40 },
  },
}

describe('renderCatalogHtml', () => {
  it('renders swagger-style listing with flow metadata', () => {
    const html = renderCatalogHtml({
      secretLoginToken: '12345',
      seedState: sampleState,
    })

    expect(html).toContain('login-and-join-lecture')
    expect(html).toContain('npm run seed login-and-join-lecture')
    expect(html).toContain('flow-item')
    expect(html).toContain('flow-search')
    expect(html).toContain('10005445')
    expect(html).toContain('btn-login-flow')
    expect(html).toContain('/api/secret-login')
  })

  it('disables login when secret token is missing', () => {
    const html = renderCatalogHtml({ secretLoginToken: '', seedState: sampleState })
    expect(html).toContain('disabled')
  })

  it('enables login via email when userId is not seeded yet', () => {
    const html = renderCatalogHtml({ secretLoginToken: '12345', seedState: {} })
    expect(html).toContain('btn-login-flow')
    expect(html).not.toMatch(/btn-login-flow[^>]*disabled/)
    expect(html).toContain('data-user-email="login-and-join-lecture.student@example.com"')
  })
})

describe('buildSecretLoginUrl', () => {
  it('builds secret login query string with userId', () => {
    expect(buildSecretLoginUrl('12345', { userId: 10005445 })).toBe(
      '/api/secret-login?token=12345&userId=10005445',
    )
  })

  it('falls back to email', () => {
    expect(buildSecretLoginUrl('12345', { email: 'student@example.com' })).toBe(
      '/api/secret-login?token=12345&email=student%40example.com',
    )
  })
})
