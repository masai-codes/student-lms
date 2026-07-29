import { describe, expect, it } from 'vitest'

import { resolveAiSummaryStatus } from '../resolveAiSummaryStatus'

describe('resolveAiSummaryStatus', () => {
  it('returns not_available when no row exists', () => {
    expect(resolveAiSummaryStatus(null)).toBe('not_available')
  })

  it('returns processing when summary is empty', () => {
    expect(
      resolveAiSummaryStatus({ summary: '   ', isSummaryPublished: 1 }),
    ).toBe('processing')
  })

  it('returns processing when summary exists but is unpublished', () => {
    expect(
      resolveAiSummaryStatus({ summary: 'Key points', isSummaryPublished: 0 }),
    ).toBe('processing')
  })

  it('returns generated when summary exists and published', () => {
    expect(
      resolveAiSummaryStatus({ summary: 'Key points', isSummaryPublished: 1 }),
    ).toBe('generated')
  })

  it('returns generated when summary exists and publish flag is null', () => {
    expect(
      resolveAiSummaryStatus({ summary: 'Key points', isSummaryPublished: null }),
    ).toBe('generated')
  })
})
