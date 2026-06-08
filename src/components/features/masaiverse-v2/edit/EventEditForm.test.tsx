// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import EventEditForm from './EventEditForm'

const { fetchEditData, updateEvent } = vi.hoisted(() => ({
  fetchEditData: vi.fn(),
  updateEvent: vi.fn(),
}))

vi.mock('@/lib/api/masaiverse-v2/masaiverseV2Api', () => ({
  fetchMasaiverseV2EventEditData: fetchEditData,
  updateMasaiverseV2Event: updateEvent,
  uploadMasaiverseV2Image: vi.fn(),
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

const ONLINE_DATA = {
  id: '5',
  columns: {
    title: 'Build Sprint',
    description: 'About',
    category: 'hackathon',
    mode: 'online',
    locationTitle: null,
    locationMapLink: null,
    eventLink: 'https://meet',
    imageLink: null,
    platform: 'Meet',
    startTime: '2026-06-10T09:00:00.000Z',
    endTime: '2026-06-10T11:00:00.000Z',
  },
  meta: { isPublished: false },
}

function renderForm(onClose = vi.fn()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <EventEditForm eventId="5" onClose={onClose} />
    </QueryClientProvider>,
  )
  return { onClose }
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(cleanup)

describe('EventEditForm', () => {
  it('shows online fields and swaps to offline fields when mode changes', async () => {
    fetchEditData.mockResolvedValue(ONLINE_DATA)
    renderForm()

    await screen.findByDisplayValue('Build Sprint')
    // Online → link + platform shown, location hidden.
    expect(screen.getByText('Event link')).toBeTruthy()
    expect(screen.getByText('Platform')).toBeTruthy()
    expect(screen.queryByText('Location title')).toBeNull()

    fireEvent.change(screen.getByDisplayValue('Online'), {
      target: { value: 'offline' },
    })

    expect(screen.getByText('Location title')).toBeTruthy()
    expect(screen.getByText('Location map link')).toBeTruthy()
    expect(screen.queryByText('Event link')).toBeNull()
  })

  it('saves the patched event and closes', async () => {
    fetchEditData.mockResolvedValue(ONLINE_DATA)
    updateEvent.mockResolvedValue({ success: true })
    const { onClose } = renderForm()

    const titleInput = await screen.findByDisplayValue('Build Sprint')
    fireEvent.change(titleInput, { target: { value: 'Renamed Sprint' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(updateEvent).toHaveBeenCalledTimes(1))
    const [eventId, patch] = updateEvent.mock.calls[0]
    expect(eventId).toBe('5')
    expect(patch.column.title).toBe('Renamed Sprint')
    expect(patch.meta).toMatchObject({ isPublished: false })
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })
})
