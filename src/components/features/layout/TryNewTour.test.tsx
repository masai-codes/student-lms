// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { TryNewTour } from './TryNewTour'

vi.mock('@tanstack/react-router', () => ({
  useRouterState: (opts: { select: (s: unknown) => unknown }) =>
    opts.select({ location: { pathname: '/learn' } }),
}))

vi.mock('@/lib/api/profile/profileApi', () => ({
  markTryNewTourSeen: vi.fn(async () => {}),
}))

vi.mock('@/query/me/meCache', () => ({ invalidateMeQuery: vi.fn() }))

const VIEWPORT_WIDTH = 1440
const VIEWPORT_HEIGHT = 900
/** Matches the toggle's real size in the navbar. */
const TOGGLE = { width: 44, height: 24 }

function renderTour() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(<TryNewTour hasSeen={false} />, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  })
}

/** Mounts a stand-in for the navbar toggle at `left`, as the tour's target. */
function mountTarget(left: number, top = 20) {
  const el = document.createElement('span')
  el.setAttribute('data-tour-target', 'try-new')
  document.body.appendChild(el)
  moveTarget(el, left, top)
  // jsdom gives every element `offsetParent === null`; the tour uses it to skip
  // hidden (mobile vs desktop) copies of the CTA.
  Object.defineProperty(el, 'offsetParent', { get: () => document.body })
  return el
}

function moveTarget(el: HTMLElement, left: number, top: number) {
  el.getBoundingClientRect = () => ({
    top,
    left,
    width: TOGGLE.width,
    height: TOGGLE.height,
    right: left + TOGGLE.width,
    bottom: top + TOGGLE.height,
    x: left,
    y: top,
    toJSON: () => ({}),
  })
}

/** Runs the tour's rAF tracking loop for a few frames. */
async function flushFrames(count = 3) {
  for (let i = 0; i < count; i++) {
    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))
    })
  }
}

function popover() {
  return screen
    .getByTestId('try-new-tour')
    .querySelector<HTMLElement>('div + div')!
}

function spotlight() {
  return screen.getByTestId('try-new-tour-spotlight')
}

const px = (value: string) => Number.parseFloat(value)
/** Centre of the popover, in viewport px. */
const centreOf = (el: HTMLElement) => px(el.style.left) + px(el.style.width) / 2

beforeEach(() => {
  window.innerWidth = VIEWPORT_WIDTH
  window.innerHeight = VIEWPORT_HEIGHT
})

afterEach(() => {
  cleanup()
  document.body.innerHTML = ''
})

describe('TryNewTour', () => {
  it('renders nothing once the user has seen it', async () => {
    mountTarget(1200)
    renderTour()
    await flushFrames()

    expect(screen.queryByTestId('try-new-tour')).toBeTruthy()

    cleanup()
    render(<TryNewTour hasSeen />, {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={new QueryClient()}>
          {children}
        </QueryClientProvider>
      ),
    })
    expect(screen.queryByTestId('try-new-tour')).toBeNull()
  })

  it('centres the popover and the spotlight on the toggle', async () => {
    const target = mountTarget(600)
    renderTour()
    await flushFrames()

    const targetCentre = 600 + TOGGLE.width / 2
    expect(centreOf(popover())).toBeCloseTo(targetCentre, 0)
    // Spotlight hugs the toggle (8px padding on each side).
    expect(px(spotlight().style.left)).toBeCloseTo(600 - 8, 0)
    expect(px(spotlight().style.width)).toBeCloseTo(TOGGLE.width + 16, 0)
    expect(px(spotlight().style.top)).toBeCloseTo(20 - 8, 0)
    // The highlight is a brand ring + glow, not only a scrim: dimming alone is
    // invisible on the dark theme. Both come off `--brand`, so they re-colour
    // with the theme, and the scrim itself is theme-conditional.
    expect(spotlight().style.boxShadow).toContain('0 0 0 2px var(--brand)')
    expect(spotlight().style.boxShadow).toContain('var(--tour-scrim)')
    expect(spotlight().className).toContain('dark:[--tour-scrim:')

    // Popover sits below the spotlight.
    expect(px(popover().style.top)).toBeCloseTo(
      20 - 8 + TOGGLE.height + 16 + 12,
      0,
    )

    // The navbar reflows around the toggle after mount (lecture banner, async
    // nav icons) — the highlight has to follow instead of staying where the
    // toggle used to be.
    moveTarget(target, 900, 20)
    await flushFrames()

    expect(px(spotlight().style.left)).toBeCloseTo(900 - 8, 0)
    expect(centreOf(popover())).toBeCloseTo(900 + TOGGLE.width / 2, 0)
  })

  it('keeps the popover inside the viewport when the toggle is near the edge', async () => {
    mountTarget(VIEWPORT_WIDTH - TOGGLE.width - 4)
    renderTour()
    await flushFrames()

    const left = px(popover().style.left)
    const width = px(popover().style.width)
    expect(left).toBeGreaterThanOrEqual(12)
    expect(left + width).toBeLessThanOrEqual(VIEWPORT_WIDTH - 12)
    // …and the caret still points at the toggle rather than the popover centre.
    const caret = popover().querySelector<HTMLElement>('span[aria-hidden]')!
    expect(px(caret.style.left)).toBeGreaterThan(width / 2)
  })

  it('drops the tour when the CTA is not on the page', async () => {
    renderTour()
    await flushFrames()

    expect(screen.queryByTestId('try-new-tour')).toBeNull()
  })
})
