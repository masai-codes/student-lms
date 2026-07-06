import { describe, expect, it } from 'vitest'
import { parseChatLanguage } from '@/server/api/ai-tutor/chatLanguage'

describe('parseChatLanguage', () => {
  it('returns undefined when language is omitted', () => {
    expect(parseChatLanguage(undefined)).toBeUndefined()
    expect(parseChatLanguage(null)).toBeUndefined()
    expect(parseChatLanguage('')).toBeUndefined()
  })

  it('accepts English and Indian language names case-insensitively', () => {
    expect(parseChatLanguage('English')).toBe('English')
    expect(parseChatLanguage('english')).toBe('English')
    expect(parseChatLanguage('Hindi')).toBe('Hindi')
    expect(parseChatLanguage('TAMIL')).toBe('Tamil')
    expect(parseChatLanguage('telugu')).toBe('Telugu')
    expect(parseChatLanguage('Kannada')).toBe('Kannada')
    expect(parseChatLanguage('malayalam')).toBe('Malayalam')
    expect(parseChatLanguage('Bengali')).toBe('Bengali')
    expect(parseChatLanguage('marathi')).toBe('Marathi')
    expect(parseChatLanguage('Gujarati')).toBe('Gujarati')
    expect(parseChatLanguage('punjabi')).toBe('Punjabi')
    expect(parseChatLanguage('Odia')).toBe('Odia')
    expect(parseChatLanguage('assamese')).toBe('Assamese')
  })

  it('accepts ISO 639-1 language codes', () => {
    expect(parseChatLanguage('en')).toBe('English')
    expect(parseChatLanguage('hi')).toBe('Hindi')
    expect(parseChatLanguage('ta')).toBe('Tamil')
    expect(parseChatLanguage('te')).toBe('Telugu')
    expect(parseChatLanguage('kn')).toBe('Kannada')
    expect(parseChatLanguage('ml')).toBe('Malayalam')
    expect(parseChatLanguage('bn')).toBe('Bengali')
    expect(parseChatLanguage('mr')).toBe('Marathi')
    expect(parseChatLanguage('gu')).toBe('Gujarati')
    expect(parseChatLanguage('pa')).toBe('Punjabi')
    expect(parseChatLanguage('or')).toBe('Odia')
    expect(parseChatLanguage('as')).toBe('Assamese')
  })

  it('rejects unknown language values', () => {
    expect(() => parseChatLanguage('spanish')).toThrowError(
      expect.objectContaining({ code: 'AI_TUTOR_LANGUAGE_INVALID' }),
    )
    expect(() => parseChatLanguage('fr')).toThrowError(
      expect.objectContaining({ code: 'AI_TUTOR_LANGUAGE_INVALID' }),
    )
    expect(() => parseChatLanguage(42)).toThrowError(
      expect.objectContaining({ code: 'AI_TUTOR_LANGUAGE_INVALID' }),
    )
  })
})
