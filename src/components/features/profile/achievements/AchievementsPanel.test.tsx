// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AchievementsPanel } from './AchievementsPanel'
import type { AchievementItem } from '@/server/api/profile/profile.types'

const hoisted = vi.hoisted(() => ({
  fetchAchievements: vi.fn(),
  pushGtmEvent: vi.fn(),
  writeText: vi.fn(),
  open: vi.fn(),
}))

vi.mock('@/lib/api/profile/profileApi', () => ({
  fetchAchievements: hoisted.fetchAchievements,
}))
vi.mock('@/utils/gtm', () => ({ pushGtmEvent: hoisted.pushGtmEvent }))
vi.mock('@/components/ui/confetti-overlay', () => ({
  ConfettiOverlay: () => null,
}))

function badge(overrides: Partial<AchievementItem> = {}): AchievementItem {
  return {
    badgeConfigId: 100,
    badgeId: 1,
    releaseDate: '2026-03-01',
    count: 1,
    isLocked: false,
    courseTitle: 'Full Stack',
    sectionModuleName: 'Foundations',
    shareKey: 'key-1',
    badge: {
      id: 1,
      title: 'First Steps',
      description: 'Completed your first lecture',
      image: 'https://cdn.example/badge.png',
      linkedinShareText: 'I earned First Steps',
      lockedDescription: 'Complete a lecture to unlock',
      theme: 'theme1',
    },
    ...overrides,
  }
}

function renderPanel() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <AchievementsPanel />
    </QueryClientProvider>,
  )
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('AchievementsPanel', () => {
  it('shows a shimmer skeleton while loading', () => {
    hoisted.fetchAchievements.mockReturnValue(new Promise(() => {}))
    renderPanel()
    expect(screen.getByTestId('profile-achievements-skeleton')).toBeTruthy()
  })

  it('shows a friendly empty state instead of rendering nothing', async () => {
    hoisted.fetchAchievements.mockResolvedValue({
      achievements: [],
      shareBaseUrl: null,
    })
    renderPanel()

    const empty = await waitFor(() =>
      screen.getByTestId('profile-achievements-empty'),
    )
    expect(empty.textContent).toContain('No badges yet')
    expect(screen.queryByTestId('profile-achievements-total')).toBeNull()
  })

  it('shows the total badge count', async () => {
    hoisted.fetchAchievements.mockResolvedValue({
      achievements: [badge(), badge({ badgeConfigId: 101 })],
      shareBaseUrl: null,
    })
    renderPanel()

    await waitFor(() =>
      expect(
        screen.getByTestId('profile-achievements-total').textContent,
      ).toBe('2'),
    )
  })

  it('groups by programme and switches module lists on programme change', async () => {
    hoisted.fetchAchievements.mockResolvedValue({
      achievements: [
        badge({ badgeConfigId: 100, courseTitle: 'A', sectionModuleName: 'M1' }),
        badge({
          badgeConfigId: 101,
          courseTitle: 'B',
          sectionModuleName: 'M9',
          badge: { ...badge().badge, title: 'B Badge' },
        }),
      ],
      shareBaseUrl: null,
    })
    renderPanel()

    await waitFor(() =>
      expect(screen.getByTestId('profile-achievements-course-A')).toBeTruthy(),
    )
    // Defaults to the first programme and its first module.
    expect(screen.getByTestId('profile-achievements-module-M1')).toBeTruthy()
    expect(screen.getByText('First Steps')).toBeTruthy()

    fireEvent.click(screen.getByTestId('profile-achievements-course-B'))
    await waitFor(() =>
      expect(screen.getByTestId('profile-achievements-module-M9')).toBeTruthy(),
    )
    expect(screen.getByText('B Badge')).toBeTruthy()
  })

  it('switches module within a programme', async () => {
    hoisted.fetchAchievements.mockResolvedValue({
      achievements: [
        badge({ badgeConfigId: 100, sectionModuleName: 'M1' }),
        badge({
          badgeConfigId: 101,
          sectionModuleName: 'M2',
          badge: { ...badge().badge, title: 'Second Badge' },
        }),
      ],
      shareBaseUrl: null,
    })
    renderPanel()

    await waitFor(() =>
      expect(screen.getByTestId('profile-achievements-module-M2')).toBeTruthy(),
    )
    expect(screen.queryByText('Second Badge')).toBeNull()

    fireEvent.click(screen.getByTestId('profile-achievements-module-M2'))
    await waitFor(() => expect(screen.getByText('Second Badge')).toBeTruthy())
  })

  it('sorts locked badges last and marks them as locked', async () => {
    hoisted.fetchAchievements.mockResolvedValue({
      achievements: [
        badge({ badgeConfigId: 100, isLocked: true, count: 0, releaseDate: null }),
        badge({ badgeConfigId: 101 }),
      ],
      shareBaseUrl: null,
    })
    renderPanel()

    await waitFor(() =>
      expect(screen.getAllByTestId('profile-achievement-badge')).toHaveLength(2),
    )
    const tiles = screen.getAllByTestId('profile-achievement-badge')
    expect(tiles[0].getAttribute('data-locked')).toBe('false')
    expect(tiles[1].getAttribute('data-locked')).toBe('true')
  })

  it('shows an xN count only for repeated awards', async () => {
    hoisted.fetchAchievements.mockResolvedValue({
      achievements: [badge({ count: 3 })],
      shareBaseUrl: null,
    })
    renderPanel()

    await waitFor(() =>
      expect(
        screen.getByTestId('profile-achievement-count').textContent,
      ).toBe('x3'),
    )
  })

  it('opens an earned badge with its unlock date and a share CTA', async () => {
    hoisted.fetchAchievements.mockResolvedValue({
      achievements: [badge()],
      shareBaseUrl: 'https://api.example',
    })
    renderPanel()

    fireEvent.click(
      await waitFor(() => screen.getByTestId('profile-achievement-badge')),
    )

    const dialog = await waitFor(() =>
      screen.getByTestId('profile-achievement-dialog'),
    )
    expect(dialog.textContent).toContain('Completed your first lecture')
    expect(
      screen.getByTestId('profile-achievement-unlocked-on').textContent,
    ).toContain('Earned on')
    expect(screen.getByTestId('profile-achievement-share')).toBeTruthy()
  })

  it('opens a locked badge with its unlock hint and no share CTA', async () => {
    hoisted.fetchAchievements.mockResolvedValue({
      achievements: [
        badge({ isLocked: true, count: 0, releaseDate: null, shareKey: null }),
      ],
      shareBaseUrl: 'https://api.example',
    })
    renderPanel()

    fireEvent.click(
      await waitFor(() => screen.getByTestId('profile-achievement-badge')),
    )

    const dialog = await waitFor(() =>
      screen.getByTestId('profile-achievement-dialog'),
    )
    expect(dialog.textContent).toContain('Complete a lecture to unlock')
    expect(dialog.textContent).toContain('Not earned yet')
    expect(screen.queryByTestId('profile-achievement-share')).toBeNull()
  })

  it('shares with the landing URL appended when sharing is configured', async () => {
    hoisted.fetchAchievements.mockResolvedValue({
      achievements: [badge()],
      shareBaseUrl: 'https://api.example',
    })
    hoisted.writeText.mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: hoisted.writeText },
    })
    vi.stubGlobal('open', hoisted.open)

    renderPanel()
    fireEvent.click(
      await waitFor(() => screen.getByTestId('profile-achievement-badge')),
    )
    fireEvent.click(
      await waitFor(() => screen.getByTestId('profile-achievement-share')),
    )

    await waitFor(() =>
      expect(hoisted.writeText).toHaveBeenCalledWith(
        'I earned First Steps https://api.example/badge/key-1',
      ),
    )
    await waitFor(() => expect(hoisted.open).toHaveBeenCalled())
    expect(hoisted.pushGtmEvent).toHaveBeenCalledWith(
      'l_profile_badge_share_id_100',
      expect.objectContaining({ entity_id: 100 }),
    )
    vi.unstubAllGlobals()
  })

  it('shares text-only when no landing URL is available', async () => {
    hoisted.fetchAchievements.mockResolvedValue({
      achievements: [badge({ shareKey: null })],
      shareBaseUrl: null,
    })
    hoisted.writeText.mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: hoisted.writeText },
    })
    vi.stubGlobal('open', hoisted.open)

    renderPanel()
    fireEvent.click(
      await waitFor(() => screen.getByTestId('profile-achievement-badge')),
    )
    fireEvent.click(
      await waitFor(() => screen.getByTestId('profile-achievement-share')),
    )

    await waitFor(() =>
      expect(hoisted.writeText).toHaveBeenCalledWith('I earned First Steps'),
    )
    vi.unstubAllGlobals()
  })

  it('fires an open event carrying the badge config id', async () => {
    hoisted.fetchAchievements.mockResolvedValue({
      achievements: [badge()],
      shareBaseUrl: null,
    })
    renderPanel()

    fireEvent.click(
      await waitFor(() => screen.getByTestId('profile-achievement-badge')),
    )
    expect(hoisted.pushGtmEvent).toHaveBeenCalledWith(
      'l_profile_badge_open_id_100',
      expect.objectContaining({ entity_id: 100, locked: false }),
    )
  })
})
