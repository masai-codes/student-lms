// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PhotoLightbox from './PhotoLightbox'

afterEach(cleanup)

describe('PhotoLightbox', () => {
  it('renders nothing when there is no source', () => {
    const { container } = render(
      <PhotoLightbox open={false} onOpenChange={() => {}} src={null} />,
    )
    expect(container.firstChild).toBeNull()
    expect(screen.queryByLabelText('Zoom in')).toBeNull()
  })

  it('shows the image and zoom controls when open', () => {
    render(
      <PhotoLightbox
        open
        onOpenChange={() => {}}
        src="https://cdn/photo.jpg"
      />,
    )
    expect(screen.getByLabelText('Zoom in')).toBeTruthy()
    expect(screen.getByText('100%')).toBeTruthy()
    // Zoom out is disabled at the minimum scale.
    expect(screen.getByLabelText('Zoom out')).toHaveProperty('disabled', true)
  })

  it('zooms in and out via the controls', () => {
    render(
      <PhotoLightbox
        open
        onOpenChange={() => {}}
        src="https://cdn/photo.jpg"
      />,
    )
    fireEvent.click(screen.getByLabelText('Zoom in'))
    expect(screen.getByText('150%')).toBeTruthy()
    expect(screen.getByLabelText('Zoom out')).toHaveProperty('disabled', false)

    fireEvent.click(screen.getByLabelText('Zoom out'))
    expect(screen.getByText('100%')).toBeTruthy()
  })

  it('calls onOpenChange when closed', () => {
    const onOpenChange = vi.fn()
    render(
      <PhotoLightbox
        open
        onOpenChange={onOpenChange}
        src="https://cdn/photo.jpg"
      />,
    )
    fireEvent.click(screen.getByLabelText('Close'))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
