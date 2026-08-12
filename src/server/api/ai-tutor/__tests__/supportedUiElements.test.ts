import { describe, expect, it } from 'vitest'
import { parseSupportedUiElements } from '@/server/api/ai-tutor/supportedUiElements'

describe('parseSupportedUiElements', () => {
  it('defaults to an empty array when omitted', () => {
    expect(parseSupportedUiElements(undefined)).toEqual([])
    expect(parseSupportedUiElements(null)).toEqual([])
  })

  it('accepts known UI elements', () => {
    expect(parseSupportedUiElements(['quiz'])).toEqual(['quiz'])
    expect(parseSupportedUiElements([])).toEqual([])
  })

  it('rejects a non-array value', () => {
    expect(() => parseSupportedUiElements('quiz')).toThrowError(
      expect.objectContaining({
        code: 'AI_TUTOR_SUPPORTED_UI_ELEMENTS_INVALID',
      }),
    )
    expect(() => parseSupportedUiElements(42)).toThrowError(
      expect.objectContaining({
        code: 'AI_TUTOR_SUPPORTED_UI_ELEMENTS_INVALID',
      }),
    )
  })

  it('rejects an unrecognized element string', () => {
    expect(() => parseSupportedUiElements(['flashcards'])).toThrowError(
      expect.objectContaining({
        code: 'AI_TUTOR_SUPPORTED_UI_ELEMENTS_INVALID',
      }),
    )
  })

  it('rejects non-string items', () => {
    expect(() => parseSupportedUiElements([42])).toThrowError(
      expect.objectContaining({
        code: 'AI_TUTOR_SUPPORTED_UI_ELEMENTS_INVALID',
      }),
    )
  })
})
