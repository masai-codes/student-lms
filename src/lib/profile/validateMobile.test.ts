import { describe, expect, it } from 'vitest'
import {
  isIndianMobile,
  maxMobileLength,
  mobileHint,
  toDigits,
  validateMobile,
} from '@/lib/profile/validateMobile'

describe('toDigits', () => {
  it('strips every non-digit character', () => {
    expect(toDigits('+91 (98765) 43210')).toBe('919876543210')
    expect(toDigits('abc')).toBe('')
  })
})

describe('isIndianMobile', () => {
  it.each(['6', '7', '8', '9'])('treats a leading %s as Indian', (digit) => {
    expect(isIndianMobile(`${digit}123456789`)).toBe(true)
  })

  it.each(['0', '1', '5', ''])(
    'treats a leading "%s" as international',
    (digit) => {
      expect(isIndianMobile(digit)).toBe(false)
    },
  )
})

describe('maxMobileLength', () => {
  it('caps Indian numbers at 10 digits', () => {
    expect(maxMobileLength('98765')).toBe(10)
  })

  it('caps international numbers at 15 digits', () => {
    expect(maxMobileLength('4471234')).toBe(15)
  })

  it('allows the widest range while the field is empty', () => {
    expect(maxMobileLength('')).toBe(15)
  })
})

describe('mobileHint', () => {
  it('explains the range before anything is typed', () => {
    expect(mobileHint('')).toContain('10 digits')
  })

  it('narrows to the Indian rule once a 9 is typed', () => {
    expect(mobileHint('9')).toBe('10 digits required')
  })

  it('narrows to the international range for other leading digits', () => {
    expect(mobileHint('44')).toBe('7–15 digits required')
  })
})

describe('validateMobile', () => {
  it('rejects an empty value', () => {
    expect(validateMobile('')).toEqual({
      isValid: false,
      message: 'Please enter a phone number',
    })
  })

  it('accepts a 10-digit Indian number', () => {
    expect(validateMobile('9876543210')).toEqual({ isValid: true })
  })

  it('accepts a formatted 10-digit Indian number', () => {
    expect(validateMobile('98765-43210')).toEqual({ isValid: true })
  })

  it('rejects an Indian number that is not exactly 10 digits', () => {
    expect(validateMobile('98765').message).toContain('exactly 10 digits')
    expect(validateMobile('98765432101').message).toContain('exactly 10 digits')
  })

  it('accepts an international number in the 7–15 range', () => {
    expect(validateMobile('4471234567')).toEqual({ isValid: true })
  })

  it('rejects an international number below 7 digits', () => {
    expect(validateMobile('123456').message).toContain('at least 7 digits')
  })

  it('rejects an international number above 15 digits', () => {
    expect(validateMobile('1234567890123456').message).toContain('exceed 15')
  })
})
