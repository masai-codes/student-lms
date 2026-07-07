// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  AI_LECTURE_CHAT_LANGUAGE_STORAGE_KEY,
  readStoredAiLectureChatLanguage,
  writeStoredAiLectureChatLanguage,
} from '../languages'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  window.localStorage.clear()
})

describe('reply-language persistence', () => {
  it('reads a valid persisted language', () => {
    window.localStorage.setItem(AI_LECTURE_CHAT_LANGUAGE_STORAGE_KEY, 'Tamil')
    expect(readStoredAiLectureChatLanguage()).toBe('Tamil')
  })

  it('defaults to English when nothing is stored', () => {
    expect(readStoredAiLectureChatLanguage()).toBe('English')
  })

  it('defaults to English when the stored value is not a known language', () => {
    window.localStorage.setItem(AI_LECTURE_CHAT_LANGUAGE_STORAGE_KEY, 'Klingon')
    expect(readStoredAiLectureChatLanguage()).toBe('English')
  })

  it('round-trips a written language', () => {
    writeStoredAiLectureChatLanguage('Hindi')
    expect(
      window.localStorage.getItem(AI_LECTURE_CHAT_LANGUAGE_STORAGE_KEY),
    ).toBe('Hindi')
    expect(readStoredAiLectureChatLanguage()).toBe('Hindi')
  })

  it('falls back to English when reading storage throws', () => {
    vi.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled')
    })
    expect(readStoredAiLectureChatLanguage()).toBe('English')
  })

  it('silently ignores a write when storage throws', () => {
    vi.spyOn(window.localStorage.__proto__, 'setItem').mockImplementation(() => {
      throw new Error('storage disabled')
    })
    expect(() => writeStoredAiLectureChatLanguage('Bengali')).not.toThrow()
  })

  it('defaults to English and no-ops a write with no window (SSR)', () => {
    vi.stubGlobal('window', undefined)
    expect(readStoredAiLectureChatLanguage()).toBe('English')
    expect(() => writeStoredAiLectureChatLanguage('Hindi')).not.toThrow()
  })
})
