// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { downloadTextFile } from './downloadTextFile'

describe('downloadTextFile', () => {
  let createObjectURL: ReturnType<typeof vi.fn>
  let revokeObjectURL: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    createObjectURL = vi.fn(() => 'blob:transcript')
    revokeObjectURL = vi.fn()
    URL.createObjectURL = createObjectURL
    URL.revokeObjectURL = revokeObjectURL
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('clicks a named anchor for a blob of the given text, then cleans up', () => {
    const clicks: Array<HTMLAnchorElement> = []
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        // Assert while the anchor is still attached — it is removed right after.
        expect(document.body.contains(this)).toBe(true)
        clicks.push(this)
      })

    downloadTextFile('lecture-7-transcript.txt', '[0:00] Hello')

    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(clicks[0].download).toBe('lecture-7-transcript.txt')
    expect(clicks[0].href).toBe('blob:transcript')
    expect(document.body.contains(clicks[0])).toBe(false)

    const blob = createObjectURL.mock.calls[0][0] as Blob
    expect(blob.type).toBe('text/plain;charset=utf-8')

    // The blob URL outlives the click tick for Safari's sake.
    expect(revokeObjectURL).not.toHaveBeenCalled()
    vi.runAllTimers()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:transcript')
  })

  it('honours a custom mime type', () => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    downloadTextFile('notes.md', '# Notes', 'text/markdown')

    const blob = createObjectURL.mock.calls[0][0] as Blob
    expect(blob.type).toBe('text/markdown')
  })

  it('no-ops when blob URLs are unavailable', () => {
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})
    // @ts-expect-error — simulate an environment without blob URL support.
    URL.createObjectURL = undefined

    expect(() => downloadTextFile('a.txt', 'body')).not.toThrow()
    expect(clickSpy).not.toHaveBeenCalled()
  })

  it('no-ops without a URL global', () => {
    vi.stubGlobal('URL', undefined)

    expect(() => downloadTextFile('a.txt', 'body')).not.toThrow()

    vi.unstubAllGlobals()
  })

  it('no-ops on the server', () => {
    vi.stubGlobal('document', undefined)

    expect(() => downloadTextFile('a.txt', 'body')).not.toThrow()
    expect(createObjectURL).not.toHaveBeenCalled()

    vi.unstubAllGlobals()
  })
})
