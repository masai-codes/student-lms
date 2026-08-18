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
import { UndertakingsTab } from './UndertakingsTab'
import { SigningContextError } from '@/lib/profile/captureSigningContext'
import type * as CaptureSigningContext from '@/lib/profile/captureSigningContext'
import type { PendingUndertaking } from '@/server/api/profile/profile.types'

const hoisted = vi.hoisted(() => ({
  fetchUndertakings: vi.fn(),
  acceptUndertakingRequest: vi.fn(),
  captureSigningContext: vi.fn(),
  pushGtmEvent: vi.fn(),
}))

vi.mock('@/lib/api/profile/profileApi', () => ({
  fetchUndertakings: hoisted.fetchUndertakings,
  acceptUndertakingRequest: hoisted.acceptUndertakingRequest,
}))
vi.mock('@/lib/profile/captureSigningContext', async () => {
  const actual = await vi.importActual<typeof CaptureSigningContext>(
    '@/lib/profile/captureSigningContext',
  )
  return {
    ...actual,
    captureSigningContext: hoisted.captureSigningContext,
  }
})
vi.mock('@/utils/gtm', () => ({ pushGtmEvent: hoisted.pushGtmEvent }))

function undertaking(
  overrides: Partial<PendingUndertaking> = {},
): PendingUndertaking {
  return {
    sectionId: 11,
    sectionName: 'DSA Section A',
    batchId: 900,
    batchName: 'SDE Batch 42',
    program: 'SDE',
    heading: 'Code of Conduct',
    pdfUrl: 'https://cdn.example/u.pdf',
    ...overrides,
  }
}

function renderTab() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <UndertakingsTab />
    </QueryClientProvider>,
  )
}

async function openFirstUndertaking() {
  await waitFor(() =>
    expect(screen.getByTestId('profile-undertaking-item')).toBeTruthy(),
  )
  fireEvent.click(screen.getByTestId('profile-undertaking-item'))
  await waitFor(() =>
    expect(screen.getByTestId('profile-undertaking-dialog')).toBeTruthy(),
  )
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('UndertakingsTab', () => {
  it('shows a skeleton while loading', () => {
    hoisted.fetchUndertakings.mockReturnValue(new Promise(() => {}))
    renderTab()
    expect(screen.getByTestId('profile-undertakings-skeleton')).toBeTruthy()
  })

  it('shows a friendly all-caught-up state when nothing is pending', async () => {
    hoisted.fetchUndertakings.mockResolvedValue([])
    renderTab()
    const empty = await waitFor(() =>
      screen.getByTestId('profile-undertakings-empty'),
    )
    expect(empty.textContent).toContain("You're all caught up")
  })

  it('shows an error state when the request fails', async () => {
    hoisted.fetchUndertakings.mockRejectedValue(new Error('boom'))
    renderTab()
    await waitFor(() =>
      expect(screen.getByTestId('profile-undertakings-error')).toBeTruthy(),
    )
  })

  it('lists each pending acknowledgement with its programme and batch', async () => {
    hoisted.fetchUndertakings.mockResolvedValue([undertaking()])
    renderTab()

    const item = await waitFor(() =>
      screen.getByTestId('profile-undertaking-item'),
    )
    expect(item.textContent).toContain('DSA Section A')
    expect(item.textContent).toContain('SDE · SDE Batch 42')
  })

  it('falls back to a generic subtitle without programme or batch', async () => {
    hoisted.fetchUndertakings.mockResolvedValue([
      undertaking({ program: null, batchName: null }),
    ])
    renderTab()

    const item = await waitFor(() =>
      screen.getByTestId('profile-undertaking-item'),
    )
    expect(item.textContent).toContain('Pending acknowledgement')
  })

  it('does not ask for location until Accept is pressed', async () => {
    hoisted.fetchUndertakings.mockResolvedValue([undertaking()])
    renderTab()
    await openFirstUndertaking()

    // Opening the document explains the requirement but prompts for nothing.
    expect(
      screen.getByTestId('profile-undertaking-dialog').textContent,
    ).toContain('ask for location permission when you accept')
    expect(hoisted.captureSigningContext).not.toHaveBeenCalled()
  })

  it('captures the signing context and submits on Accept', async () => {
    hoisted.fetchUndertakings.mockResolvedValue([undertaking()])
    hoisted.captureSigningContext.mockResolvedValue({
      location: 'Bengaluru',
      ipAddress: '1.2.3.4',
    })
    hoisted.acceptUndertakingRequest.mockResolvedValue({ accepted: true })
    renderTab()
    await openFirstUndertaking()

    fireEvent.click(screen.getByTestId('profile-undertaking-accept'))

    await waitFor(() =>
      expect(hoisted.acceptUndertakingRequest).toHaveBeenCalledWith({
        sectionId: 11,
        location: 'Bengaluru',
        ipAddress: '1.2.3.4',
      }),
    )
    await waitFor(() =>
      expect(screen.queryByTestId('profile-undertaking-dialog')).toBeNull(),
    )
  })

  it('offers a retry with the real reason when location is denied', async () => {
    hoisted.fetchUndertakings.mockResolvedValue([undertaking()])
    hoisted.captureSigningContext.mockRejectedValue(
      new SigningContextError('PERMISSION_DENIED', 'Location access was blocked.'),
    )
    renderTab()
    await openFirstUndertaking()

    fireEvent.click(screen.getByTestId('profile-undertaking-accept'))

    const error = await waitFor(() =>
      screen.getByTestId('profile-undertaking-error'),
    )
    expect(error.textContent).toContain('Location access was blocked.')
    // The dialog stays open, and the CTA becomes a retry.
    expect(screen.getByTestId('profile-undertaking-dialog')).toBeTruthy()
    expect(
      screen.getByTestId('profile-undertaking-accept').textContent,
    ).toContain('Try again')
    expect(hoisted.acceptUndertakingRequest).not.toHaveBeenCalled()
  })

  it('shows a generic message when the submission itself fails', async () => {
    hoisted.fetchUndertakings.mockResolvedValue([undertaking()])
    hoisted.captureSigningContext.mockResolvedValue({
      location: 'Bengaluru',
      ipAddress: '1.2.3.4',
    })
    hoisted.acceptUndertakingRequest.mockRejectedValue(new Error('boom'))
    renderTab()
    await openFirstUndertaking()

    fireEvent.click(screen.getByTestId('profile-undertaking-accept'))
    const error = await waitFor(() =>
      screen.getByTestId('profile-undertaking-error'),
    )
    expect(error.textContent).toContain('could not record your acceptance')
  })

  it('clears the error when the dialog is closed', async () => {
    hoisted.fetchUndertakings.mockResolvedValue([undertaking()])
    hoisted.captureSigningContext.mockRejectedValue(
      new SigningContextError('TIMEOUT', 'Took too long.'),
    )
    renderTab()
    await openFirstUndertaking()

    fireEvent.click(screen.getByTestId('profile-undertaking-accept'))
    await waitFor(() =>
      expect(screen.getByTestId('profile-undertaking-error')).toBeTruthy(),
    )

    fireEvent.click(screen.getByTestId('profile-undertaking-close'))
    await waitFor(() =>
      expect(screen.queryByTestId('profile-undertaking-dialog')).toBeNull(),
    )
  })

  it('fires view and accept analytics events with the section id', async () => {
    hoisted.fetchUndertakings.mockResolvedValue([undertaking()])
    hoisted.captureSigningContext.mockResolvedValue({
      location: 'Bengaluru',
      ipAddress: '1.2.3.4',
    })
    hoisted.acceptUndertakingRequest.mockResolvedValue({ accepted: true })
    renderTab()
    await openFirstUndertaking()

    expect(hoisted.pushGtmEvent).toHaveBeenCalledWith(
      'l_profile_undertaking_view_id_11',
      expect.objectContaining({ entity_id: 11 }),
    )

    fireEvent.click(screen.getByTestId('profile-undertaking-accept'))
    expect(hoisted.pushGtmEvent).toHaveBeenCalledWith(
      'l_profile_undertaking_accept_id_11',
      expect.objectContaining({ entity_id: 11 }),
    )
  })
})
