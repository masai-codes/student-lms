// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { DownloadAppContent } from './DownloadAppContent'

afterEach(cleanup)

describe('DownloadAppContent', () => {
  it('renders both store badges and default QR codes', () => {
    render(<DownloadAppContent />)
    expect(screen.getByTestId('download-app-content')).toBeTruthy()
    expect(screen.getByTestId('download-app-google-play')).toBeTruthy()
    expect(screen.getByTestId('download-app-app-store')).toBeTruthy()
    expect(screen.getByAltText('Google Play QR code')).toBeTruthy()
    expect(screen.getByAltText('App Store QR code')).toBeTruthy()
  })

  it('honours overridden QR urls', () => {
    render(
      <DownloadAppContent
        googlePlayQRUrl="https://x/g.png"
        appStoreQRUrl="https://x/a.png"
      />,
    )
    expect(
      screen
        .getByAltText<HTMLImageElement>('Google Play QR code')
        .getAttribute('src'),
    ).toBe('https://x/g.png')
  })
})
