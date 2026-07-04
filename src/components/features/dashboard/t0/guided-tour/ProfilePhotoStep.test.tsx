// @vitest-environment jsdom
import { forwardRef, useImperativeHandle } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ProfilePhotoStep } from './ProfilePhotoStep'

const SHOT = 'data:image/jpeg;base64,ZmFrZQ=='
const hoisted = vi.hoisted(() => ({ upload: vi.fn() }))

vi.mock('@/lib/api/dashboard/dashboardApi', () => ({ uploadProfilePhoto: hoisted.upload }))
vi.mock('react-webcam', () => ({
  default: forwardRef((props: Record<string, unknown>, ref) => {
    useImperativeHandle(ref, () => ({ getScreenshot: () => SHOT }))
    return <div data-testid={props['data-testid'] as string} />
  }),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})
beforeEach(() => {
  hoisted.upload.mockResolvedValue({ url: 'https://s3/pic.jpg' })
})

function renderStep(onCompleted = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <ProfilePhotoStep onCompleted={onCompleted} />
    </QueryClientProvider>,
  )
  return { onCompleted }
}

describe('ProfilePhotoStep', () => {
  it('starts on the placeholder + Enable Camera, then shows the webcam', () => {
    renderStep()
    expect(screen.getByTestId('guided-tour-profile-photo-placeholder')).toBeTruthy()
    fireEvent.click(screen.getByTestId('guided-tour-profile-photo-enable'))
    expect(screen.getByTestId('guided-tour-profile-photo-webcam')).toBeTruthy()
    expect(screen.getByTestId('guided-tour-profile-photo-capture')).toBeTruthy()
  })

  it('captures a still and shows Retake / Submit', () => {
    renderStep()
    fireEvent.click(screen.getByTestId('guided-tour-profile-photo-enable'))
    fireEvent.click(screen.getByTestId('guided-tour-profile-photo-capture'))
    const preview = screen.getByTestId<HTMLImageElement>('guided-tour-profile-photo-preview')
    expect(preview.getAttribute('src')).toBe(SHOT)
    expect(screen.getByTestId('guided-tour-profile-photo-retake')).toBeTruthy()
    expect(screen.getByTestId('guided-tour-profile-photo-submit')).toBeTruthy()
  })

  it('submits the captured image and reports completion', async () => {
    const { onCompleted } = renderStep()
    fireEvent.click(screen.getByTestId('guided-tour-profile-photo-enable'))
    fireEvent.click(screen.getByTestId('guided-tour-profile-photo-capture'))
    fireEvent.click(screen.getByTestId('guided-tour-profile-photo-submit'))

    await waitFor(() => expect(hoisted.upload).toHaveBeenCalledWith(SHOT))
    await waitFor(() => expect(onCompleted).toHaveBeenCalled())
    expect(screen.getByTestId('guided-tour-profile-photo-done')).toBeTruthy()
  })

  it('retake clears the capture and re-enables the camera', () => {
    renderStep()
    fireEvent.click(screen.getByTestId('guided-tour-profile-photo-enable'))
    fireEvent.click(screen.getByTestId('guided-tour-profile-photo-capture'))
    fireEvent.click(screen.getByTestId('guided-tour-profile-photo-retake'))
    expect(screen.getByTestId('guided-tour-profile-photo-webcam')).toBeTruthy()
    expect(screen.queryByTestId('guided-tour-profile-photo-preview')).toBeNull()
  })
})
