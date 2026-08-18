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
import { StudentKitTab } from './StudentKitTab'
import type { StudentKitStatus } from '@/server/api/profile/profile.types'

const hoisted = vi.hoisted(() => ({
  fetchStudentKit: vi.fn(),
  pushGtmEvent: vi.fn(),
  writeText: vi.fn(),
}))

vi.mock('@/lib/api/profile/profileApi', () => ({
  fetchStudentKit: hoisted.fetchStudentKit,
}))
vi.mock('@/utils/gtm', () => ({ pushGtmEvent: hoisted.pushGtmEvent }))

function kit(overrides: Partial<StudentKitStatus> = {}): StudentKitStatus {
  return {
    showKit: true,
    detailsFilled: true,
    admissionsFormUrl: null,
    trackingId: 'AWB123',
    trackingUrl: 'https://track.example/AWB123',
    ...overrides,
  }
}

function renderTab() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <StudentKitTab />
    </QueryClientProvider>,
  )
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('StudentKitTab', () => {
  it('shows a skeleton while loading', () => {
    hoisted.fetchStudentKit.mockReturnValue(new Promise(() => {}))
    renderTab()
    expect(screen.getByTestId('profile-kit-skeleton')).toBeTruthy()
  })

  it('shows an error state when the request fails', async () => {
    hoisted.fetchStudentKit.mockRejectedValue(new Error('boom'))
    renderTab()
    await waitFor(() =>
      expect(screen.getByTestId('profile-kit-error')).toBeTruthy(),
    )
  })

  it('sends the student to Admissions when details are unfilled', async () => {
    hoisted.fetchStudentKit.mockResolvedValue(
      kit({
        detailsFilled: false,
        admissionsFormUrl: 'https://admissions/form',
        trackingId: null,
        trackingUrl: null,
      }),
    )
    renderTab()

    await waitFor(() =>
      expect(screen.getByTestId('profile-kit-details-pending')).toBeTruthy(),
    )
    const link = screen.getByTestId<HTMLAnchorElement>(
      'profile-kit-admissions-link',
    )
    expect(link.getAttribute('href')).toBe('https://admissions/form')
    expect(link.getAttribute('target')).toBe('_blank')

    fireEvent.click(link)
    expect(hoisted.pushGtmEvent).toHaveBeenCalledWith(
      'l_profile_student_kit_admissions_click',
      {},
    )
  })

  it('omits the CTA when the Admissions URL could not be built', async () => {
    hoisted.fetchStudentKit.mockResolvedValue(
      kit({
        detailsFilled: false,
        admissionsFormUrl: null,
        trackingId: null,
        trackingUrl: null,
      }),
    )
    renderTab()

    await waitFor(() =>
      expect(screen.getByTestId('profile-kit-details-pending')).toBeTruthy(),
    )
    expect(screen.queryByTestId('profile-kit-admissions-link')).toBeNull()
  })

  it('reassures the student while tracking is not yet issued', async () => {
    hoisted.fetchStudentKit.mockResolvedValue(
      kit({ trackingId: null, trackingUrl: null }),
    )
    renderTab()

    const awaiting = await waitFor(() =>
      screen.getByTestId('profile-kit-awaiting-tracking'),
    )
    expect(awaiting.textContent).toContain('Details submitted')
  })

  it('shows the tracking id, link and how-to steps', async () => {
    hoisted.fetchStudentKit.mockResolvedValue(kit())
    renderTab()

    await waitFor(() =>
      expect(screen.getByTestId('profile-kit-tracking-id').textContent).toBe(
        'AWB123',
      ),
    )
    const link = screen.getByTestId<HTMLAnchorElement>(
      'profile-kit-tracking-link',
    )
    expect(link.getAttribute('href')).toBe('https://track.example/AWB123')
    expect(link.getAttribute('rel')).toContain('noopener')
    expect(screen.getByText(/Copy your tracking ID/)).toBeTruthy()
  })

  it('copies the tracking id and confirms it', async () => {
    hoisted.fetchStudentKit.mockResolvedValue(kit())
    hoisted.writeText.mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: hoisted.writeText },
    })
    renderTab()

    const button = await waitFor(() =>
      screen.getByTestId('profile-kit-copy-tracking-id'),
    )
    expect(button.getAttribute('aria-label')).toBe('Copy tracking ID')

    fireEvent.click(button)
    await waitFor(() =>
      expect(hoisted.writeText).toHaveBeenCalledWith('AWB123'),
    )
    await waitFor(() =>
      expect(
        screen.getByTestId('profile-kit-copy-tracking-id').getAttribute(
          'aria-label',
        ),
      ).toBe('Tracking ID copied'),
    )
    expect(hoisted.pushGtmEvent).toHaveBeenCalledWith(
      'l_profile_student_kit_copy_tracking_id',
      {},
    )
  })

  it('stays quiet when the clipboard write is refused', async () => {
    hoisted.fetchStudentKit.mockResolvedValue(kit())
    hoisted.writeText.mockRejectedValue(new Error('denied'))
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: hoisted.writeText },
    })
    renderTab()

    fireEvent.click(
      await waitFor(() => screen.getByTestId('profile-kit-copy-tracking-id')),
    )
    await waitFor(() => expect(hoisted.writeText).toHaveBeenCalled())
    expect(
      screen
        .getByTestId('profile-kit-copy-tracking-id')
        .getAttribute('aria-label'),
    ).toBe('Copy tracking ID')
  })

  it('handles a tracking link with no id', async () => {
    hoisted.fetchStudentKit.mockResolvedValue(kit({ trackingId: null }))
    renderTab()

    await waitFor(() =>
      expect(screen.getByTestId('profile-kit-tracking-link')).toBeTruthy(),
    )
    expect(screen.queryByTestId('profile-kit-copy-tracking-id')).toBeNull()
    expect(screen.getByText('Not available yet')).toBeTruthy()
  })

  it('falls back to the awaiting state when the kit does not apply', async () => {
    hoisted.fetchStudentKit.mockResolvedValue(
      kit({
        showKit: false,
        detailsFilled: false,
        trackingId: null,
        trackingUrl: null,
      }),
    )
    renderTab()
    await waitFor(() =>
      expect(screen.getByTestId('profile-kit-awaiting-tracking')).toBeTruthy(),
    )
  })

  it('records the tracking-link click', async () => {
    hoisted.fetchStudentKit.mockResolvedValue(kit())
    renderTab()

    fireEvent.click(
      await waitFor(() => screen.getByTestId('profile-kit-tracking-link')),
    )
    expect(hoisted.pushGtmEvent).toHaveBeenCalledWith(
      'l_profile_student_kit_tracking_link_click',
      {},
    )
  })
})
