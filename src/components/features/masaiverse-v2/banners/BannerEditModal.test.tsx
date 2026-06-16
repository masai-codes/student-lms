// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import BannerEditModal from './BannerEditModal'

const { updateBanner } = vi.hoisted(() => ({
  updateBanner: vi.fn(),
}))

vi.mock('@/lib/api/masaiverse-v2/masaiverseV2Api', () => ({
  updateMasaiverseV2Banner: updateBanner,
}))

vi.mock('@/components/discussion-post-card/rich-text-editor', () => ({
  RichTextEditor: ({
    value,
    onChange,
  }: {
    value: string
    onChange: (value: string) => void
  }) => (
    <textarea value={value} onChange={(event) => onChange(event.target.value)} />
  ),
}))

const BANNER = {
  id: '5',
  title: 'Welcome',
  description: 'Hello',
  ctaText: 'Go',
  ctaUrl: 'https://x',
  isPublished: false,
}

function renderModal(onClose = vi.fn()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <BannerEditModal banner={BANNER} open onClose={onClose} />
    </QueryClientProvider>,
  )
  return { onClose }
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(cleanup)

describe('BannerEditModal', () => {
  it('saves the edited banner (column + meta) and closes', async () => {
    updateBanner.mockResolvedValue({ success: true })
    const { onClose } = renderModal()

    fireEvent.change(screen.getByDisplayValue('Welcome'), {
      target: { value: 'Updated' },
    })
    fireEvent.click(screen.getByRole('switch', { name: 'Published' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(updateBanner).toHaveBeenCalledTimes(1))
    const [bannerId, patch] = updateBanner.mock.calls[0]
    expect(bannerId).toBe('5')
    expect(patch.column.title).toBe('Updated')
    expect(patch.meta).toEqual({ isPublished: true })
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })
})
