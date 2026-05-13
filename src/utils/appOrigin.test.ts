import { afterEach, describe, expect, it, vi } from 'vitest'
import { getConfiguredAppOrigin, withAppOriginHeader } from '@/utils/appOrigin'

describe('appOrigin', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('uses masai by default', () => {
    vi.stubEnv('VITE_APP_ORIGIN', '')
    expect(getConfiguredAppOrigin()).toBe('masai')
  })

  it('reads ihub from env', () => {
    vi.stubEnv('VITE_APP_ORIGIN', 'ihub')
    expect(getConfiguredAppOrigin()).toBe('ihub')
  })

  it('adds X-App-Origin header', () => {
    vi.stubEnv('VITE_APP_ORIGIN', 'ihub')
    const headers = withAppOriginHeader({ 'Content-Type': 'application/json' })

    expect(headers.get('Content-Type')).toBe('application/json')
    expect(headers.get('X-App-Origin')).toBe('ihub')
  })
})
