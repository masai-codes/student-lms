// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { LECTURE_SPLIT_CHAT_STORAGE_KEY } from '../../constants/lectureSplitLayout'
import { useLectureSplitChatOpen } from '../useLectureSplitChatOpen'

describe('useLectureSplitChatOpen', () => {
  afterEach(() => {
    cleanup()
    window.localStorage.clear()
  })

  it('starts collapsed when no preference is stored', () => {
    const { result } = renderHook(() => useLectureSplitChatOpen())

    expect(result.current.isOpen).toBe(false)
  })

  it('restores a stored open preference on mount', () => {
    window.localStorage.setItem(LECTURE_SPLIT_CHAT_STORAGE_KEY, 'true')

    const { result } = renderHook(() => useLectureSplitChatOpen())

    expect(result.current.isOpen).toBe(true)
  })

  it('persists open and close actions', () => {
    const { result } = renderHook(() => useLectureSplitChatOpen())

    act(() => {
      result.current.open()
    })

    expect(result.current.isOpen).toBe(true)
    expect(window.localStorage.getItem(LECTURE_SPLIT_CHAT_STORAGE_KEY)).toBe('true')

    act(() => {
      result.current.close()
    })

    expect(result.current.isOpen).toBe(false)
    expect(window.localStorage.getItem(LECTURE_SPLIT_CHAT_STORAGE_KEY)).toBe('false')
  })
})
