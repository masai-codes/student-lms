// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ClubGalleryPage from './ClubGalleryPage'
import type { ReactNode } from 'react'
import { ApiClientError } from '@/lib/api/apiClientError'

const { useQuery } = vi.hoisted(() => ({ useQuery: vi.fn() }))

vi.mock('@tanstack/react-query', () => ({ useQuery: () => useQuery() }))
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
}))

afterEach(() => {
  cleanup()
  useQuery.mockReset()
})

describe('ClubGalleryPage', () => {
  it('shows a loading state while pending', () => {
    useQuery.mockReturnValue({ isPending: true })
    render(<ClubGalleryPage clubId="5" />)
    expect(screen.getByLabelText('Loading gallery')).toBeTruthy()
  })

  it('shows a not-found message on a 404', () => {
    useQuery.mockReturnValue({
      isPending: false,
      error: new ApiClientError(404, { code: 'CLUB_NOT_FOUND' }),
    })
    render(<ClubGalleryPage clubId="5" />)
    expect(screen.getByText('Club not found')).toBeTruthy()
  })

  it('renders every gallery image with a count', () => {
    useQuery.mockReturnValue({
      isPending: false,
      error: null,
      data: {
        name: 'Programming Club',
        galleryImages: ['https://cdn/a.jpg', 'https://cdn/b.jpg'],
      },
    })
    const { container } = render(<ClubGalleryPage clubId="5" />)
    expect(screen.getByText('Programming Club — Photos')).toBeTruthy()
    expect(screen.getByText('2 photos')).toBeTruthy()
    expect(container.querySelectorAll('img')).toHaveLength(2)
  })

  it('opens the zoomable lightbox when a photo is clicked', () => {
    useQuery.mockReturnValue({
      isPending: false,
      error: null,
      data: {
        name: 'Programming Club',
        galleryImages: ['https://cdn/a.jpg', 'https://cdn/b.jpg'],
      },
    })
    render(<ClubGalleryPage clubId="5" />)
    expect(screen.queryByLabelText('Zoom in')).toBeNull()

    fireEvent.click(screen.getByLabelText('Open photo 1'))
    expect(screen.getByLabelText('Zoom in')).toBeTruthy()
  })

  it('shows an empty state when there are no photos', () => {
    useQuery.mockReturnValue({
      isPending: false,
      error: null,
      data: { name: 'Programming Club', galleryImages: [] },
    })
    render(<ClubGalleryPage clubId="5" />)
    expect(screen.getByText('No photos yet.')).toBeTruthy()
    expect(screen.getByText('0 photos')).toBeTruthy()
  })
})
