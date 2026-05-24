// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'

function measureViewportBottomInset(selector: string): number {
  const element = document.querySelector(selector)
  if (!element) return 0

  const rect = element.getBoundingClientRect()
  return Math.max(0, Math.ceil(window.innerHeight - rect.top))
}

describe('measureViewportBottomInset', () => {
  it('returns viewport space below the element top edge', () => {
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 800,
    })

    const footer = document.createElement('footer')
    footer.dataset.testid = 'assignment-detail-sticky-footer'
    footer.getBoundingClientRect = () =>
      ({
        top: 680,
        bottom: 800,
        left: 0,
        right: 0,
        width: 0,
        height: 120,
        x: 0,
        y: 680,
        toJSON: () => ({}),
      }) as DOMRect

    document.body.appendChild(footer)

    expect(
      measureViewportBottomInset('[data-testid="assignment-detail-sticky-footer"]'),
    ).toBe(120)

    footer.remove()
  })
})
