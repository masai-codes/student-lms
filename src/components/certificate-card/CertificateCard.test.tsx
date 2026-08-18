// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CertificateCard, CertificateViewModal } from './CertificateCard'
import type { CertificateCardData } from './CertificateCard'

const hoisted = vi.hoisted(() => ({ writeText: vi.fn(), open: vi.fn() }))

vi.mock('@/components/ui/confetti-overlay', () => ({
  ConfettiOverlay: () => null,
}))

function certificate(
  overrides: Partial<CertificateCardData> = {},
): CertificateCardData {
  return {
    certificateObjectId: 'obj-1',
    code: null,
    pdfUrl: null,
    verificationUrl: 'https://verification.masaischool.com/certificate/tvCdrL9pXW',
    certificateTitle: 'Certificate for Event Participation',
    certificateType: 'Course Completion',
    issuedDateIso: '2026-02-01T00:00:00.000Z',
    batchName: 'IITRPRAI-2409',
    ...overrides,
  }
}

function renderCard(overrides: Partial<CertificateCardData> = {}) {
  hoisted.writeText.mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: hoisted.writeText },
  })
  vi.stubGlobal('open', hoisted.open)
  return render(<CertificateCard certificate={certificate(overrides)} />)
}

const viewBtn = () =>
  screen.getByTestId<HTMLButtonElement>('certificate-card-view')

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

describe('CertificateCard', () => {
  it('renders the title, type, issue date and enrolment batch', () => {
    renderCard()
    expect(screen.getByText('Certificate for Event Participation')).toBeTruthy()
    expect(screen.getByText(/Course Completion/)).toBeTruthy()
    expect(screen.getByText(/IITRPRAI-2409/)).toBeTruthy()
  })

  it('always offers Share, even with no verification link', () => {
    renderCard({ verificationUrl: null })
    // Regression: Share used to be gated on verificationUrl, so a certificate
    // without one showed no Share button at all — unlike the old LMS.
    expect(screen.getByTestId('certificate-card-share')).toBeTruthy()
  })

  it('copies the post text and opens the LinkedIn composer', async () => {
    renderCard()
    fireEvent.click(screen.getByTestId('certificate-card-share'))

    await waitFor(() =>
      expect(hoisted.writeText).toHaveBeenCalledWith(
        'I am excited to share my Certificate for Event Participation (Course Completion) certificate. ' +
          'Verify it here: https://verification.masaischool.com/certificate/tvCdrL9pXW',
      ),
    )
    await waitFor(() =>
      expect(hoisted.open).toHaveBeenCalledWith(
        expect.stringContaining('linkedin.com/sharing/share-offsite'),
        '_blank',
        'noopener,noreferrer',
      ),
    )
  })

  it('still opens LinkedIn when the clipboard write is refused', async () => {
    renderCard()
    hoisted.writeText.mockRejectedValue(new Error('denied'))

    fireEvent.click(screen.getByTestId('certificate-card-share'))
    await waitFor(() => expect(hoisted.open).toHaveBeenCalled())
  })

  it('enables View and previews the verification page', async () => {
    renderCard()
    expect(viewBtn().disabled).toBe(false)

    fireEvent.click(viewBtn())
    const frame = await waitFor(() =>
      screen.getByTestId<HTMLIFrameElement>('certificate-view-frame'),
    )
    expect(frame.getAttribute('src')).toBe(
      'https://verification.masaischool.com/certificate/tvCdrL9pXW',
    )
  })

  it('falls back to the signed file when there is no verification page', async () => {
    renderCard({
      verificationUrl: null,
      pdfUrl: 'https://s3.example/cert.png?sig=1',
    })
    fireEvent.click(viewBtn())

    const frame = await waitFor(() =>
      screen.getByTestId<HTMLIFrameElement>('certificate-view-frame'),
    )
    expect(frame.getAttribute('src')).toBe('https://s3.example/cert.png?sig=1')
  })

  it('disables View when nothing is displayable', () => {
    renderCard({ verificationUrl: null, pdfUrl: null })
    expect(viewBtn().disabled).toBe(true)
  })

  it('never iframes a non-URL verification value', () => {
    // The legacy pipeline used to supply `share_text` here.
    renderCard({
      verificationUrl: "Excited to share that I've completed my certification 🎓",
      pdfUrl: null,
    })
    expect(viewBtn().disabled).toBe(true)
  })

  it('explains itself instead of showing a blank frame', () => {
    // Reached via the course page's own card, which opens the shared modal even
    // when nothing is previewable.
    render(
      <CertificateViewModal
        open
        onClose={vi.fn()}
        certificate={certificate({ verificationUrl: null, pdfUrl: null })}
      />,
    )

    expect(screen.queryByTestId('certificate-view-frame')).toBeNull()
    expect(
      screen.getByTestId('certificate-view-unavailable').textContent,
    ).toContain("can't be previewed yet")
    // Sharing is still offered; opening in a new tab is not.
    expect(screen.getByTestId('certificate-view-share')).toBeTruthy()
    expect(screen.queryByTestId('certificate-view-open-new-tab')).toBeNull()
  })

  it('offers Open-in-new-tab only alongside a real preview', async () => {
    renderCard()
    fireEvent.click(viewBtn())

    const link = await waitFor(() =>
      screen.getByTestId<HTMLAnchorElement>('certificate-view-open-new-tab'),
    )
    expect(link.getAttribute('href')).toBe(
      'https://verification.masaischool.com/certificate/tvCdrL9pXW',
    )
    expect(link.getAttribute('rel')).toContain('noopener')
  })

  it('shows a dash for a missing batch name', () => {
    renderCard({ batchName: '' })
    // The label is its own <span>; assert on the row that contains it.
    expect(screen.getByText('Batch:').parentElement?.textContent).toContain('-')
  })
})
