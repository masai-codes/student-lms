import { afterEach, describe, expect, it, vi } from 'vitest'
import { getPostLogoutRedirectUrl } from '@/utils/authRedirect'

describe('getPostLogoutRedirectUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('uses VITE_NEW_STUDENT_UI_URL/signin when configured', () => {
    vi.stubEnv('VITE_NEW_STUDENT_UI_URL', 'http://localhost:3002/')
    expect(getPostLogoutRedirectUrl()).toBe('http://localhost:3002/signin')
  })

  it('falls back to /signin when new student URL is unset', () => {
    vi.stubEnv('VITE_NEW_STUDENT_UI_URL', '')
    expect(getPostLogoutRedirectUrl()).toBe('/signin')
  })
})
