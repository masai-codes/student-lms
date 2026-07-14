// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import BannersSection from './BannersSection'
import type { ReactNode } from 'react'

const { fetchBanners, fetchAdminMode, createBanner } = vi.hoisted(() => ({
  fetchBanners: vi.fn(),
  fetchAdminMode: vi.fn(),
  createBanner: vi.fn(),
}))

vi.mock('@/lib/api/masaiverse-v2/masaiverseV2Api', () => ({
  fetchMasaiverseV2Banners: fetchBanners,
  fetchMasaiverseV2AdminMode: fetchAdminMode,
  createMasaiverseV2Banner: createBanner,
  updateMasaiverseV2Banner: vi.fn(),
  deleteMasaiverseV2Banner: vi.fn(),
}))

// Swiper needs layout APIs jsdom lacks; render slides as plain divs.
vi.mock('swiper/react', () => ({
  Swiper: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SwiperSlide: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))
vi.mock('swiper/modules', () => ({ Navigation: {}, Pagination: {} }))

function banner(overrides = {}) {
  return {
    id: '1',
    title: 'Welcome',
    description: 'Hello there',
    ctaText: null,
    ctaUrl: null,
    isPublished: true,
    ...overrides,
  }
}

function renderSection() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <BannersSection />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(cleanup)

describe('BannersSection', () => {
  it('renders nothing for a student when there are no banners', async () => {
    fetchBanners.mockResolvedValue([])
    fetchAdminMode.mockResolvedValue({ isAdmin: false, enabled: false })
    const { container } = renderSection()
    await waitFor(() => expect(fetchBanners).toHaveBeenCalled())
    expect(container.querySelector('section')).toBeNull()
  })

  it('shows a published banner to a student without admin controls', async () => {
    fetchBanners.mockResolvedValue([banner()])
    fetchAdminMode.mockResolvedValue({ isAdmin: false, enabled: false })
    renderSection()
    expect(await screen.findByText('Welcome')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /add banner/i })).toBeNull()
  })

  it('lets an admin add a banner', async () => {
    fetchBanners.mockResolvedValue([])
    fetchAdminMode.mockResolvedValue({ isAdmin: true, enabled: true })
    createBanner.mockResolvedValue({ id: '2' })
    renderSection()

    const addButton = await screen.findByRole('button', { name: /add banner/i })
    fireEvent.click(addButton)
    await waitFor(() => expect(createBanner).toHaveBeenCalledTimes(1))
  })

  it('shows a draft badge + edit control for an admin', async () => {
    fetchBanners.mockResolvedValue([
      banner({ isPublished: false, title: 'Draft B' }),
    ])
    fetchAdminMode.mockResolvedValue({ isAdmin: true, enabled: true })
    renderSection()

    expect(await screen.findByText('Draft B')).toBeTruthy()
    expect(screen.getByText('Draft')).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Edit banner Draft B' }),
    ).toBeTruthy()
  })
})
