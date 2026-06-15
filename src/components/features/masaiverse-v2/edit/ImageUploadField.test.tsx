// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ImageUploadField from './ImageUploadField'

const { uploadImage } = vi.hoisted(() => ({ uploadImage: vi.fn() }))

vi.mock('@/lib/api/masaiverse-v2/masaiverseV2Api', () => ({
  uploadMasaiverseV2Image: uploadImage,
}))

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(cleanup)

describe('ImageUploadField', () => {
  it('uploads a chosen file and reports the returned URL', async () => {
    uploadImage.mockResolvedValue({ url: 'https://bucket.s3.amazonaws.com/x.png' })
    const onChange = vi.fn()
    const { container } = render(
      <ImageUploadField value={null} onChange={onChange} label="Banner" />,
    )

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File([new Uint8Array([1])], 'pic.png', { type: 'image/png' })
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith('https://bucket.s3.amazonaws.com/x.png'),
    )
    expect(uploadImage).toHaveBeenCalledWith(file)
  })

  it('lets the user paste a URL directly', () => {
    const onChange = vi.fn()
    render(<ImageUploadField value={null} onChange={onChange} label="Banner" />)

    const urlInput = screen.getByPlaceholderText('or paste an image URL')
    fireEvent.change(urlInput, { target: { value: 'https://cdn/manual.png' } })
    expect(onChange).toHaveBeenCalledWith('https://cdn/manual.png')
  })

  it('shows an error when the upload fails', async () => {
    uploadImage.mockRejectedValue(new Error('nope'))
    const { container } = render(
      <ImageUploadField value={null} onChange={vi.fn()} />,
    )

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, {
      target: { files: [new File([new Uint8Array([1])], 'a.png', { type: 'image/png' })] },
    })

    expect(await screen.findByText(/upload failed/i)).toBeTruthy()
  })
})
