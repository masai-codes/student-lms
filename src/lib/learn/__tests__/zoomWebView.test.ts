import { afterEach, describe, expect, it, vi } from 'vitest'

import { buildZoomWebViewUrl } from '../zoomWebView'

const hoisted = vi.hoisted(() => ({ getOldStudentUiUrlFromEnv: vi.fn() }))

vi.mock('@/utils/viteEnv', () => ({
  getOldStudentUiUrlFromEnv: hoisted.getOldStudentUiUrlFromEnv,
}))

describe('buildZoomWebViewUrl', () => {
  afterEach(() => vi.clearAllMocks())

  it('builds the old LMS embed URL when the legacy base resolves', () => {
    hoisted.getOldStudentUiUrlFromEnv.mockReturnValue(
      'https://students.masaischool.com',
    )
    expect(buildZoomWebViewUrl(572)).toBe(
      'https://students.masaischool.com/lectures/572/zoom',
    )
  })

  it('returns null when the legacy base URL is unresolved', () => {
    hoisted.getOldStudentUiUrlFromEnv.mockReturnValue(undefined)
    expect(buildZoomWebViewUrl(572)).toBeNull()
  })
})
