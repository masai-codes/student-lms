// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ClubEditForm from './ClubEditForm'

const { fetchEditData, updateClub } = vi.hoisted(() => ({
  fetchEditData: vi.fn(),
  updateClub: vi.fn(),
}))

vi.mock('@/lib/api/masaiverse-v2/masaiverseV2Api', () => ({
  fetchMasaiverseV2ClubEditData: fetchEditData,
  updateMasaiverseV2Club: updateClub,
  uploadMasaiverseV2Image: vi.fn(),
}))

// Tiptap doesn't run cleanly in jsdom; stand in with a textarea.
vi.mock('@/components/discussion-post-card/rich-text-editor', () => ({
  RichTextEditor: ({
    value,
    onChange,
  }: {
    value: string
    onChange: (value: string) => void
  }) => (
    <textarea
      aria-label="rich editor"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}))

function renderForm(onClose = vi.fn()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <ClubEditForm clubId="5" onClose={onClose} />
    </QueryClientProvider>,
  )
  return { onClose }
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(cleanup)

describe('ClubEditForm', () => {
  it('seeds the form from edit data and saves a name change', async () => {
    fetchEditData.mockResolvedValue({
      id: '5',
      name: 'Old Club',
      meta: { description: 'About', clubDetailBannerTags: ['t'] },
    })
    updateClub.mockResolvedValue({ success: true })
    const { onClose } = renderForm()

    const nameInput = await screen.findByDisplayValue('Old Club')
    fireEvent.change(nameInput, { target: { value: 'New Club' } })

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(updateClub).toHaveBeenCalledTimes(1))
    const [clubId, patch] = updateClub.mock.calls[0]
    expect(clubId).toBe('5')
    expect(patch.column).toEqual({ name: 'New Club' })
    expect(patch.meta).toMatchObject({
      description: 'About',
      clubDetailBannerTags: ['t'],
    })
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('shows a loading state until the edit data resolves', () => {
    fetchEditData.mockReturnValue(new Promise(() => {}))
    renderForm()
    expect(screen.getByRole('status')).toBeTruthy()
  })
})
