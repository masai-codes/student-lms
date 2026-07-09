// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AgreementStep } from './AgreementStep'
import type { AgreementSection } from '@/server/api/dashboard/agreement/getAgreementRenderData.service'

const hoisted = vi.hoisted(() => ({ save: vi.fn(), submit: vi.fn(), recordView: vi.fn(), isMobile: vi.fn() }))

vi.mock('@/lib/api/dashboard/dashboardApi', () => ({
  saveAgreementDetailsApi: hoisted.save,
  submitAgreementApi: hoisted.submit,
  recordAgreementViewedApi: hoisted.recordView,
}))
vi.mock('@/hooks/useIsMobileViewport', () => ({
  useIsMobileViewport: () => hoisted.isMobile(),
}))
vi.mock('./useAutoDetectLocation', () => ({
  useAutoDetectLocation: () => ({ detected: null, status: 'idle', detect: vi.fn() }),
}))

const VALID_VALUES = {
  name: 'Riya', dateOfBirth: '2000-01-01', gender: 'female', address: '12 MG Rd', location: 'Bengaluru',
  parentsName: 'Anil', parentsEmail: 'anil@example.com', parentsMobileCountry: '+91', parentsMobile: '9876543210',
  currentStatus: 'working', workDomain: 'tech', educationDetails: 'btech_cs', graduationYear: '2021', collegeName: 'IIT',
}

function section(over: Partial<AgreementSection> = {}): AgreementSection {
  return {
    sectionId: 7, sectionName: 'Enrolment', programName: 'MERN', batchName: 'B1',
    steps: [{ key: 'program_agreement', heading: 'Program', pdfUrl: 'https://x/p.pdf', order: null }],
    savedValues: VALID_VALUES, acceptedStepKeys: [], completed: false,
    referenceNumber: 'TC-1-section_7', agreementPdfUrl: null,
    viewTime: null, daysSinceFirstView: 0, daysLeft: 7, hoursLeft: null, isClosable: true,
    ...over,
  }
}

function renderStep(sec: AgreementSection, onCompleted = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <AgreementStep section={sec} onCompleted={onCompleted} />
    </QueryClientProvider>,
  )
  return { onCompleted }
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})
beforeEach(() => {
  hoisted.isMobile.mockReturnValue(false)
  hoisted.save.mockResolvedValue({ savedValues: VALID_VALUES, referenceNumber: 'TC-1-section_7' })
  hoisted.submit.mockResolvedValue({ agreementPdfUrl: 'https://s3/a.pdf' })
  hoisted.recordView.mockResolvedValue({ viewTime: '2026-01-01T00:00:00.000Z' })
})

describe('AgreementStep', () => {
  it('shows the desktop-only notice on mobile', () => {
    hoisted.isMobile.mockReturnValue(true)
    renderStep(section())
    expect(screen.getByTestId('agreement-mobile-notice')).toBeTruthy()
    expect(screen.queryByTestId('agreement-step')).toBeNull()
  })

  it('shows the completed summary with a PDF link once signed', () => {
    renderStep(section({ completed: true, agreementPdfUrl: 'https://s3/a.pdf' }))
    expect(screen.getByTestId('agreement-completed')).toBeTruthy()
    expect(screen.getByTestId('agreement-view-pdf').getAttribute('href')).toBe('https://s3/a.pdf')
  })

  it('records the first view and shows the days-remaining countdown', async () => {
    renderStep(section({ viewTime: null, daysLeft: 7 }))
    expect(screen.getByTestId('agreement-countdown').textContent).toContain('7 days remaining')
    await waitFor(() => expect(hoisted.recordView).toHaveBeenCalledWith(7))
  })

  it('counts down in hours when under a day remains in the review window', () => {
    renderStep(section({ viewTime: '2026-01-01T00:00:00.000Z', daysLeft: 0, hoursLeft: 5, daysSinceFirstView: 6, isClosable: true }))
    const text = screen.getByTestId('agreement-countdown').textContent
    expect(text).toContain('5 hours remaining')
    expect(text).not.toContain('day')
  })

  it('shows the paused message (and does not re-record) once the window has elapsed', () => {
    renderStep(section({ viewTime: '2026-01-01T00:00:00.000Z', daysLeft: 0, daysSinceFirstView: 8, isClosable: false }))
    expect(screen.getByTestId('agreement-countdown').textContent).toContain('paused')
    expect(hoisted.recordView).not.toHaveBeenCalled()
  })

  it('renders a horizontal tab per sub-step and lets you jump back to a completed one', async () => {
    renderStep(section({
      steps: [
        { key: 'program_agreement', heading: 'Program Agreement', pdfUrl: 'u', order: 1 },
        { key: 'grading_policy', heading: 'Grading Policy', pdfUrl: 'u', order: 2 },
        { key: 'posh_compliance', heading: 'POSH Compliance', pdfUrl: 'u', order: 3 },
        { key: 'placement_coc', heading: 'Placement COC', pdfUrl: 'u', order: 4 },
      ],
    }))
    // 4 documents + Enter Details + Signature Certificate = 6 tabs.
    expect(screen.getByTestId('agreement-step-tab-0')).toBeTruthy()
    expect(screen.getByTestId('agreement-step-tab-5')).toBeTruthy()
    expect(screen.queryByTestId('agreement-step-tab-6')).toBeNull()
    expect(screen.getByText('Enter Details')).toBeTruthy()
    expect(screen.getByText('Placement COC')).toBeTruthy()

    // Advance off details (location is mandatory → check the box first), then
    // click the first tab to jump back.
    fireEvent.click(screen.getByTestId('agreement-location-consent-input'))
    fireEvent.click(screen.getByTestId('agreement-continue'))
    await waitFor(() => expect(screen.getByTestId('agreement-pdf-viewer')).toBeTruthy())
    fireEvent.click(screen.getByTestId('agreement-step-tab-0'))
    expect(screen.getByTestId('agreement-details-form')).toBeTruthy()
  })

  it('shows the location consent checkbox + read-only detected location', () => {
    renderStep(section())
    expect(screen.getByTestId('agreement-location-consent-input')).toBeTruthy()
    expect(screen.getByTestId('agreement-location-value').textContent).toContain('Bengaluru')
  })

  it('blocks Continue and points to the enable-location guide until the box is checked', () => {
    renderStep(section({ savedValues: { ...VALID_VALUES, location: undefined } }))
    expect(screen.queryByTestId('agreement-location-value')).toBeNull()
    // The "how to enable location" guide is offered while the box is unchecked.
    expect(screen.getByTestId('agreement-location-guide')).toBeTruthy()
    // Location is mandatory, so Continue tells the learner it's required and blocks.
    expect(screen.getByTestId('agreement-continue-hint').textContent).toContain('Location access is required')
    fireEvent.click(screen.getByTestId('agreement-continue'))
    expect(screen.queryByTestId('agreement-pdf-viewer')).toBeNull()
    expect(screen.getByTestId('agreement-location-error').textContent).toContain('Please select the checkbox to fetch location')
  })

  it('still blocks when the box is checked but no location could be captured', () => {
    renderStep(section({ savedValues: { ...VALID_VALUES, location: undefined } }))
    fireEvent.click(screen.getByTestId('agreement-location-consent-input'))
    fireEvent.click(screen.getByTestId('agreement-continue'))
    expect(screen.queryByTestId('agreement-pdf-viewer')).toBeNull()
    expect(screen.getByTestId('agreement-location-error').textContent).toContain('Location is required')
  })

  it('keeps Continue clickable on the details step and shows a live count of fields needing attention', () => {
    renderStep(section({ savedValues: { ...VALID_VALUES, name: '', parentsEmail: 'not-an-email' } }))
    // Continue stays enabled so it can surface the errors (instead of a dead disabled button).
    expect(screen.getByTestId<HTMLButtonElement>('agreement-continue').disabled).toBe(false)
    // The learner is told up front how many fields need fixing.
    expect(screen.getByTestId('agreement-continue-hint').textContent).toContain('2 fields need')
    // Errors aren't shown until they attempt to continue.
    expect(screen.queryByTestId('agreement-validation-summary')).toBeNull()
  })

  it('reveals a detailed, labelled summary of every invalid field when Continue is pressed', () => {
    renderStep(section({ savedValues: { ...VALID_VALUES, name: '', parentsEmail: 'not-an-email' } }))
    fireEvent.click(screen.getByTestId('agreement-continue'))

    const summary = screen.getByTestId('agreement-validation-summary')
    expect(summary.textContent).toContain('Please fix 2 fields')
    // Each issue is listed by its human-readable label + reason.
    expect(screen.getByTestId('agreement-validation-summary-item-name').textContent).toContain('Name')
    expect(screen.getByTestId('agreement-validation-summary-item-name').textContent).toContain('required')
    expect(screen.getByTestId('agreement-validation-summary-item-parentsEmail').textContent).toContain("Parent's Email ID")
    expect(screen.getByTestId('agreement-validation-summary-item-parentsEmail').textContent).toContain('valid email')
    // It did not advance to the document step.
    expect(screen.queryByTestId('agreement-pdf-viewer')).toBeNull()
    expect(hoisted.save).not.toHaveBeenCalled()
  })

  it('tells the learner to accept the document when Continue is disabled on a document step', async () => {
    renderStep(section())
    fireEvent.click(screen.getByTestId('agreement-location-consent-input'))
    fireEvent.click(screen.getByTestId('agreement-continue'))
    await waitFor(() => expect(screen.getByTestId('agreement-pdf-viewer')).toBeTruthy())
    expect(screen.getByTestId('agreement-continue').getAttribute('disabled')).not.toBeNull()
    expect(screen.getByTestId('agreement-continue-hint').textContent).toContain('accept the document')
  })

  it('walks details → document → certificate → submit', async () => {
    const { onCompleted } = renderStep(section())
    // Location is mandatory: check the consent box (a location is already prefilled).
    fireEvent.click(screen.getByTestId('agreement-location-consent-input'))
    // Details are prefilled + valid → Continue autosaves and advances.
    fireEvent.click(screen.getByTestId('agreement-continue'))
    await waitFor(() => expect(hoisted.save).toHaveBeenCalledWith(7, expect.objectContaining({ name: 'Riya' })))
    expect(screen.getByTestId('agreement-pdf-viewer')).toBeTruthy()

    // Must accept the document before continuing.
    expect(screen.getByTestId<HTMLButtonElement>('agreement-continue').disabled).toBe(true)
    fireEvent.click(screen.getByTestId('agreement-accept-input'))
    fireEvent.click(screen.getByTestId('agreement-continue'))

    // Certificate → submit.
    expect(screen.getByTestId('agreement-certificate')).toBeTruthy()
    fireEvent.click(screen.getByTestId('agreement-submit'))
    await waitFor(() => expect(hoisted.submit).toHaveBeenCalledWith(7))
    await waitFor(() => expect(onCompleted).toHaveBeenCalled())
  })
})
