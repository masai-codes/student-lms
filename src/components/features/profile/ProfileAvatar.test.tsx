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
import { ProfileAvatar } from './ProfileAvatar'

const hoisted = vi.hoisted(() => ({
  uploadProfilePhoto: vi.fn(),
  pushGtmEvent: vi.fn(),
}))

vi.mock('@/lib/api/dashboard/dashboardApi', () => ({
  uploadProfilePhoto: hoisted.uploadProfilePhoto,
}))
vi.mock('@/utils/gtm', () => ({ pushGtmEvent: hoisted.pushGtmEvent }))

function renderAvatar(avatarUrl: string | null = null, name = 'Riya Sharma') {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ProfileAvatar name={name} avatarUrl={avatarUrl} />
    </QueryClientProvider>,
  )
}

/** A File whose reported size can be forced, to exercise the size guard. */
function imageFile(options: { type?: string; size?: number } = {}) {
  const file = new File(['data'], 'photo.png', {
    type: options.type ?? 'image/png',
  })
  if (options.size !== undefined) {
    Object.defineProperty(file, 'size', { value: options.size })
  }
  return file
}

function selectFile(file: File) {
  fireEvent.change(screen.getByTestId('profile-avatar-file-input'), {
    target: { files: [file] },
  })
}

const status = () => screen.getByTestId('profile-avatar-status').textContent

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('ProfileAvatar', () => {
  it('shows the photo when there is one', () => {
    renderAvatar('https://cdn.example/me.png')
    expect(
      screen
        .getByTestId<HTMLImageElement>('profile-avatar-image')
        .getAttribute('src'),
    ).toBe('https://cdn.example/me.png')
    expect(screen.queryByTestId('profile-avatar-initials')).toBeNull()
  })

  it('falls back to two-letter initials', () => {
    renderAvatar(null)
    expect(screen.getByTestId('profile-avatar-initials').textContent).toBe('RS')
  })

  it('uses one initial for a single-word name', () => {
    renderAvatar(null, 'Riya')
    expect(screen.getByTestId('profile-avatar-initials').textContent).toBe('R')
  })

  it('falls back to "?" for a blank name', () => {
    renderAvatar(null, '   ')
    expect(screen.getByTestId('profile-avatar-initials').textContent).toBe('?')
  })

  it('offers an upload affordance the old page lacked', () => {
    renderAvatar(null)
    const button = screen.getByTestId('profile-avatar-upload-button')
    expect(button.getAttribute('aria-label')).toBe('Change profile photo')

    fireEvent.click(button)
    expect(hoisted.pushGtmEvent).toHaveBeenCalledWith(
      'l_profile_avatar_upload_open',
      {},
    )
  })

  it('uploads a chosen image as a data URL', async () => {
    hoisted.uploadProfilePhoto.mockResolvedValue({
      url: 'https://cdn.example/new.png',
    })
    renderAvatar(null)

    selectFile(imageFile())

    await waitFor(() => expect(hoisted.uploadProfilePhoto).toHaveBeenCalled())
    expect(hoisted.uploadProfilePhoto.mock.calls[0][0]).toMatch(
      /^data:image\/png;base64,/,
    )
  })

  it('rejects a non-image file without uploading', async () => {
    renderAvatar(null)
    selectFile(imageFile({ type: 'application/pdf' }))

    await waitFor(() =>
      expect(status()).toBe('Please choose an image file.'),
    )
    expect(hoisted.uploadProfilePhoto).not.toHaveBeenCalled()
  })

  it('rejects an oversized image before uploading', async () => {
    renderAvatar(null)
    selectFile(imageFile({ size: 6 * 1024 * 1024 }))

    await waitFor(() =>
      expect(status()).toBe('Please choose an image under 5 MB.'),
    )
    expect(hoisted.uploadProfilePhoto).not.toHaveBeenCalled()
  })

  it('does nothing when the picker is dismissed', () => {
    renderAvatar(null)
    fireEvent.change(screen.getByTestId('profile-avatar-file-input'), {
      target: { files: [] },
    })
    expect(hoisted.uploadProfilePhoto).not.toHaveBeenCalled()
    expect(status()).toBe('')
  })

  it('reports a failed upload', async () => {
    hoisted.uploadProfilePhoto.mockRejectedValue(new Error('boom'))
    renderAvatar(null)

    selectFile(imageFile())
    await waitFor(() =>
      expect(status()).toBe('Upload failed. Please try again.'),
    )
  })

  it('announces progress while uploading', async () => {
    hoisted.uploadProfilePhoto.mockReturnValue(new Promise(() => {}))
    renderAvatar(null)

    selectFile(imageFile())
    await waitFor(() => expect(status()).toBe('Uploading…'))
    expect(
      screen.getByTestId<HTMLButtonElement>('profile-avatar-upload-button')
        .disabled,
    ).toBe(true)
  })
})
