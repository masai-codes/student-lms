import { describe, expect, it, vi } from 'vitest'
import { getAuthBranding } from '@/utils/authBranding'

describe('getAuthBranding', () => {
  it('returns masai branding by default', () => {
    vi.stubEnv('VITE_APP_ORIGIN', '')
    expect(getAuthBranding()).toMatchObject({
      logoSrc: '/masai-logo.svg',
      logoAlt: 'Masai School',
    })
  })

  it('returns ihub branding when configured', () => {
    vi.stubEnv('VITE_APP_ORIGIN', 'ihub')
    expect(getAuthBranding()).toMatchObject({
      logoSrc: '/ihub-logo.png',
      logoAlt: 'i-HUB Divyasampark',
    })
  })
})
