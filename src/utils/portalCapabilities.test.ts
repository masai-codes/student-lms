import { describe, expect, it } from 'vitest'
import {
  CHAT_PORTALS,
  ID_CARD_PORTALS,
  MASAI_LIVE_PROMO_PORTALS,
  MOBILE_APP_PORTALS,
  SECTION_ON_LEARN_CARD_PORTALS,
  SUPPORT_PORTALS,
  portalHasChat,
  portalHasIdCard,
  portalHasMasaiLivePromo,
  portalHasMobileApp,
  portalHasSupport,
  portalShowsSectionOnLearnCard,
} from './portalCapabilities'

describe('portalHasMobileApp', () => {
  it('allows Masai and IIT Jodhpur, but not iHub', () => {
    expect(portalHasMobileApp('masai')).toBe(true)
    expect(portalHasMobileApp('iitj')).toBe(true)
    expect(portalHasMobileApp('ihub')).toBe(false)
  })

  it('stays in sync with the allowlist', () => {
    // Update both this list and MOBILE_APP_PORTALS together when a portal gains
    // (or loses) the app.
    expect([...MOBILE_APP_PORTALS]).toEqual(['masai', 'iitj'])
  })
})

describe('portalHasChat', () => {
  it('allows Masai and IIT Jodhpur, but not iHub', () => {
    expect(portalHasChat('masai')).toBe(true)
    expect(portalHasChat('iitj')).toBe(true)
    expect(portalHasChat('ihub')).toBe(false)
  })

  it('stays in sync with the allowlist', () => {
    expect([...CHAT_PORTALS]).toEqual(['masai', 'iitj'])
  })
})

describe('portalHasMasaiLivePromo', () => {
  it('hides the Masai-branded promo on IIT Jodhpur', () => {
    expect(portalHasMasaiLivePromo('masai')).toBe(true)
    expect(portalHasMasaiLivePromo('ihub')).toBe(true)
    expect(portalHasMasaiLivePromo('iitj')).toBe(false)
  })

  it('stays in sync with the allowlist', () => {
    expect([...MASAI_LIVE_PROMO_PORTALS]).toEqual(['masai', 'ihub'])
  })
})

describe('portalHasSupport', () => {
  it('hides Support on IIT Jodhpur only', () => {
    expect(portalHasSupport('masai')).toBe(true)
    expect(portalHasSupport('ihub')).toBe(true)
    expect(portalHasSupport('iitj')).toBe(false)
  })

  it('stays in sync with the allowlist', () => {
    expect([...SUPPORT_PORTALS]).toEqual(['masai', 'ihub'])
  })
})

describe('portalHasIdCard', () => {
  it('hides the ID card on IIT Jodhpur only', () => {
    expect(portalHasIdCard('masai')).toBe(true)
    expect(portalHasIdCard('ihub')).toBe(true)
    expect(portalHasIdCard('iitj')).toBe(false)
  })

  it('stays in sync with the allowlist', () => {
    expect([...ID_CARD_PORTALS]).toEqual(['masai', 'ihub'])
  })
})

describe('portalShowsSectionOnLearnCard', () => {
  it('allows only IIT Jodhpur', () => {
    expect(portalShowsSectionOnLearnCard('iitj')).toBe(true)
    expect(portalShowsSectionOnLearnCard('masai')).toBe(false)
    expect(portalShowsSectionOnLearnCard('ihub')).toBe(false)
  })

  it('stays in sync with the allowlist', () => {
    expect([...SECTION_ON_LEARN_CARD_PORTALS]).toEqual(['iitj'])
  })
})
