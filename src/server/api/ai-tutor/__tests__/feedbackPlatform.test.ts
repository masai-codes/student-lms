import { describe, expect, it } from 'vitest'
import {
  encodeFeedbackWithPlatform,
  parsePlatform,
  parseRatingForPlatform,
} from '@/server/api/ai-tutor/feedbackPlatform'

describe('parsePlatform', () => {
  it('defaults to web when platform is omitted', () => {
    expect(parsePlatform(undefined)).toBe('web')
    expect(parsePlatform(null)).toBe('web')
    expect(parsePlatform('')).toBe('web')
  })

  it('accepts ios, android, and web case-insensitively', () => {
    expect(parsePlatform('ios')).toBe('ios')
    expect(parsePlatform('IOS')).toBe('ios')
    expect(parsePlatform('android')).toBe('android')
    expect(parsePlatform('web')).toBe('web')
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
  it('accepts 0 or 1 for web', () => {
    expect(parseRatingForPlatform(0, 'web')).toBe(0)
    expect(parseRatingForPlatform(1, 'web')).toBe(1)
  })

  it('rejects out-of-range web ratings', () => {
    expect(() => parseRatingForPlatform(2, 'web')).toThrowError(
      expect.objectContaining({ code: 'AI_TUTOR_RATING_INVALID' }),
    )
  })

  it('shifts mobile ratings by +1', () => {
    expect(parseRatingForPlatform(1, 'ios')).toBe(2)
    expect(parseRatingForPlatform(5, 'android')).toBe(6)
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
