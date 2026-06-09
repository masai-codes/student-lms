import { describe, expect, it } from 'vitest'
import { getAuthBranding } from '@/utils/authBranding'

describe('getAuthBranding', () => {
  it('returns masai branding for the masai origin', () => {
    expect(getAuthBranding('masai')).toMatchObject({
      logoSrc: '/masai-logo.svg',
      logoAlt: 'Masai School',
    })
  })

  it('returns ihub branding for the ihub origin', () => {
    expect(getAuthBranding('ihub')).toMatchObject({
      logoSrc: '/ihub-logo.png',
      logoAlt: 'i-HUB Divyasampark',
      pageTitle: 'iHub DivyaSampark',
      signInHeading: 'iHub DivyaSampark',
      showLegalLinks: false,
    })
  })
})
