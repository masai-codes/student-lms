import { describe, expect, it } from 'vitest'
import {
  encodeFeedbackWithPlatform,
  feedbackHasAnyPlatformPrefix,
  feedbackHasIosOrAndroidPrefix,
  feedbackHasPlatformPrefix,
  parsePlatform,
  parseRatingForPlatform,
} from '@/server/api/ai-tutor/feedbackPlatform'

describe('parsePlatform', () => {
  it('defaults to app when platform is omitted', () => {
    expect(parsePlatform(undefined)).toBe('app')
    expect(parsePlatform(null)).toBe('app')
    expect(parsePlatform('')).toBe('app')
  })

  it('accepts ios, android, web, web-mobile, web-desktop, and app case-insensitively', () => {
    expect(parsePlatform('ios')).toBe('ios')
    expect(parsePlatform('IOS')).toBe('ios')
    expect(parsePlatform('android')).toBe('android')
    expect(parsePlatform('web')).toBe('web')
    expect(parsePlatform('web-mobile')).toBe('web-mobile')
    expect(parsePlatform('WEB-MOBILE')).toBe('web-mobile')
    expect(parsePlatform('web-desktop')).toBe('web-desktop')
    expect(parsePlatform('WEB-DESKTOP')).toBe('web-desktop')
    expect(parsePlatform('app')).toBe('app')
    expect(parsePlatform('APP')).toBe('app')
  })

  it('rejects unknown platform values', () => {
    expect(() => parsePlatform('windows')).toThrowError(
      expect.objectContaining({ code: 'AI_TUTOR_PLATFORM_INVALID' }),
    )
    expect(() => parsePlatform(42)).toThrowError(
      expect.objectContaining({ code: 'AI_TUTOR_PLATFORM_INVALID' }),
    )
  })
})

describe('parseRatingForPlatform', () => {
  it('accepts 0 or 1 for web-like platforms', () => {
    expect(parseRatingForPlatform(0, 'web')).toBe(0)
    expect(parseRatingForPlatform(1, 'web')).toBe(1)
    expect(parseRatingForPlatform(0, 'web-mobile')).toBe(0)
    expect(parseRatingForPlatform(1, 'web-desktop')).toBe(1)
    expect(parseRatingForPlatform(0, 'app')).toBe(0)
    expect(parseRatingForPlatform(1, 'app')).toBe(1)
  })

  it('accepts 1 through 5 for ios and android', () => {
    expect(parseRatingForPlatform(1, 'ios')).toBe(1)
    expect(parseRatingForPlatform(5, 'android')).toBe(5)
  })

  it('rejects out-of-range mobile ratings', () => {
    expect(() => parseRatingForPlatform(0, 'ios')).toThrowError(
      expect.objectContaining({ code: 'AI_TUTOR_RATING_INVALID' }),
    )
    expect(() => parseRatingForPlatform(6, 'android')).toThrowError(
      expect.objectContaining({ code: 'AI_TUTOR_RATING_INVALID' }),
    )
  })
})

describe('encodeFeedbackWithPlatform', () => {
  it('prefixes user feedback with platform and a dash', () => {
    expect(encodeFeedbackWithPlatform('ios', 'Great session')).toBe(
      'ios-Great session',
    )
  })

  it('stores only the platform when feedback is blank', () => {
    expect(encodeFeedbackWithPlatform('web', null)).toBe('web')
    expect(encodeFeedbackWithPlatform('android', '   ')).toBe('android')
  })
})

describe('feedback platform prefixes', () => {
  it('detects exact and dashed platform prefixes', () => {
    expect(feedbackHasPlatformPrefix('ios', 'ios')).toBe(true)
    expect(feedbackHasPlatformPrefix('ios-Great', 'ios')).toBe(true)
    expect(feedbackHasPlatformPrefix('web-mobile', 'web-mobile')).toBe(true)
    expect(feedbackHasPlatformPrefix('web-mobile', 'web')).toBe(false)
    expect(feedbackHasIosOrAndroidPrefix('android')).toBe(true)
    expect(feedbackHasAnyPlatformPrefix('app-Helpful')).toBe(true)
    expect(feedbackHasAnyPlatformPrefix('legacy')).toBe(false)
  })
})
