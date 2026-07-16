import { describe, expect, it } from 'vitest'
import {
  formatPhoneOtpHint,
  identifierErrorMessage,
  parseIdentifier,
} from '@/components/features/sign-in/detectIdentifier'

describe('parseIdentifier', () => {
  it('rejects empty and whitespace-only input', () => {
    expect(parseIdentifier('')).toEqual({ ok: false, reason: 'empty' })
    expect(parseIdentifier('   ')).toEqual({ ok: false, reason: 'empty' })
  })

  it('accepts a simple valid email', () => {
    expect(parseIdentifier('User@Example.COM')).toEqual({
      ok: true,
      kind: 'email',
      value: 'user@example.com',
    })
  })

  it('rejects malformed email when @ is present', () => {
    expect(parseIdentifier('not-an-email@')).toEqual({
      ok: false,
      reason: 'invalid_email',
    })
  })

  it('accepts 10-digit phone without country code', () => {
    const r = parseIdentifier('9876543210')
    expect(r).toEqual({
      ok: true,
      kind: 'phone',
      display: '9876543210',
      digits: '9876543210',
    })
  })

  it('accepts exactly 10 digits with spaces for readability', () => {
    const r = parseIdentifier('98765 43210')
    expect(r).toEqual({
      ok: true,
      kind: 'phone',
      display: '98765 43210',
      digits: '9876543210',
    })
  })

  it('rejects numbers with country code (more than 10 digits)', () => {
    expect(parseIdentifier('+91 98765 43210')).toEqual({
      ok: false,
      reason: 'invalid_phone',
    })
    expect(parseIdentifier('919876543210')).toEqual({
      ok: false,
      reason: 'invalid_phone',
    })
  })

  it('rejects 11–15 digit strings', () => {
    expect(parseIdentifier('12345678901')).toEqual({
      ok: false,
      reason: 'invalid_phone',
    })
    expect(parseIdentifier('123456789012345')).toEqual({
      ok: false,
      reason: 'invalid_phone',
    })
  })

  it('rejects too-short digit-only input as phone', () => {
    expect(parseIdentifier('123456789')).toEqual({
      ok: false,
      reason: 'invalid_phone',
    })
  })

  it('rejects too-long digit-only input', () => {
    expect(parseIdentifier('1234567890123456')).toEqual({
      ok: false,
      reason: 'invalid_phone',
    })
  })
})

describe('identifierErrorMessage', () => {
  it('returns a message for each failure reason', () => {
    expect(identifierErrorMessage('empty').length).toBeGreaterThan(0)
    expect(identifierErrorMessage('invalid_email').length).toBeGreaterThan(0)
    expect(identifierErrorMessage('invalid_phone').length).toBeGreaterThan(0)
  })
})

describe('formatPhoneOtpHint', () => {
  it('masks 10-digit numbers keeping last four digits visible', () => {
    expect(formatPhoneOtpHint('9876543210')).toBe('••••3210')
  })

  it('returns bullet-only form for very short digit strings', () => {
    expect(formatPhoneOtpHint('12')).toMatch(/^•+$/)
  })
})
