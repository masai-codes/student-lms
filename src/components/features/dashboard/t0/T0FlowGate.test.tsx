// @vitest-environment jsdom
import { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { T0FlowGate, isGuidedTourVisible } from './T0FlowGate'
import type { T0FlowLecturesResult } from '@/server/api/dashboard/getT0FlowLectures.service'
import type { T0FlowStatus } from '@/server/api/dashboard/getT0FlowStatus.service'

const hoisted = vi.hoisted(() => ({ fetchLectures: vi.fn() }))

// Non-primary batches fetch lectures here; the primary batch's come via props.
vi.mock('@/lib/api/dashboard/dashboardApi', () => ({
  fetchT0FlowLectures: hoisted.fetchLectures,
}))
// The player isn't the unit under test — stub it.
vi.mock('./guided-tour/GuidedTourVideoStep', () => ({
  GuidedTourVideoStep: () => <div data-testid="guided-tour-video-stub" />,
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

const lectures: T0FlowLecturesResult = {
  lmsLectures: [
    {
      id: 'a',
      lectureId: 1,
      title: 'Intro',
      videoUrl: 'v',
      lectureType: 'video',
    },
  ],
  programLectures: [],
  completedLectureIds: [],
  legalAgreementSections: [],
  isDocumentsRequired: false,
  documentsUploaded: false,
  studentKit: {
    applicable: false,
    detailsFilled: false,
    trackingUrl: null,
    trackingId: null,
    admissionsFormUrl: null,
  },
  idCardApplicable: true,
  idCardUrl: null,
}

const baseStatus = (over: Partial<T0FlowStatus> = {}): T0FlowStatus => ({
  showT0Flow: true,
  batches: [
    {
      batchId: 5,
      batchName: 'MERN',
      showProgramTab: false,
      lms: { completed: 1, total: 4, complete: false },
      program: null,
      lectures,
      flowVariant: 'full',
    },
  ],
  profilePhotoUrl: null,
  downloadAppCompleted: false,
  showGuidedTour: true,
  flowVariant: 'full',
  ...over,
})

// Mirrors the dashboard page: visibility (dismiss + the "keep open once shown"
// latch) is computed above the gate, so "See dashboard" (onDismiss) hides the
// overlay and a mid-view completion doesn't yank it away.
function StatefulGate({
  status,
  forceOpen = false,
}: {
  status: T0FlowStatus
  forceOpen?: boolean
}) {
  const [dismissed, setDismissed] = useState(false)
  const [latched, setLatched] = useState(false)
  const eligible = isGuidedTourVisible(status, { dismissed, forceOpen })
  useEffect(() => {
    if (eligible) setLatched(true)
  }, [eligible])
  const open = eligible || (latched && !dismissed)
  return (
    <T0FlowGate
      status={status}
      open={open}
      onDismiss={() => {
        setDismissed(true)
        setLatched(false)
      }}
      target={null}
      feePaymentBanners={[]}
    />
  )
}

function renderGate(status: T0FlowStatus, forceOpen = false) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <StatefulGate status={status} forceOpen={forceOpen} />
    </QueryClientProvider>,
  )
}

describe('T0FlowGate', () => {
  it('renders nothing when the backend says not to show the tour', () => {
    renderGate(baseStatus({ showGuidedTour: false }))
    expect(screen.queryByTestId('guided-tour-overlay')).toBeNull()
  })

  it('force-opens the tour even when onboarding is complete (navbar "?")', () => {
    // Completed onboarding: showGuidedTour is false, but forceOpen wins.
    renderGate(
      baseStatus({
        showGuidedTour: false,
        batches: [
          {
            batchId: 5,
            batchName: 'MERN',
            showProgramTab: false,
            lms: { completed: 4, total: 4, complete: true },
            program: null,
            lectures,
            flowVariant: 'full',
          },
        ],
      }),
      true,
    )
    expect(screen.getByTestId('guided-tour-overlay')).toBeTruthy()
  })

  it('force-open still shows nothing when the user has no onboarding flow', () => {
    renderGate(baseStatus({ showT0Flow: false }), true)
    expect(screen.queryByTestId('guided-tour-overlay')).toBeNull()
  })

  it('shows the tour with progress + steps when eligible (primary lectures from props, no fetch)', () => {
    renderGate(baseStatus())
    expect(screen.getByTestId('guided-tour-overlay')).toBeTruthy()
    expect(screen.getByTestId('guided-tour-progress-label').textContent).toBe(
      '1 of 4 done',
    )
    expect(screen.getByTestId('guided-tour-step-lecture-1')).toBeTruthy()
    expect(screen.getByTestId('guided-tour-step-profile-photo')).toBeTruthy()
    // Program tab is always visible but locked when full fees are unpaid.
    expect(
      screen.getByTestId('guided-tour-tab-program').getAttribute('data-locked'),
    ).toBe('true')
    expect(screen.getByTestId('guided-tour-tab-program-lock')).toBeTruthy()
    // Primary-batch lectures came from props — no on-demand fetch.
    expect(hoisted.fetchLectures).not.toHaveBeenCalled()
  })

  it('hides the tour after "See dashboard"', () => {
    renderGate(baseStatus())
    expect(screen.getByTestId('guided-tour-overlay')).toBeTruthy()
    fireEvent.click(screen.getByTestId('guided-tour-see-dashboard'))
    expect(screen.queryByTestId('guided-tour-overlay')).toBeNull()
  })

  it('unlocks the Program Onboarding tab when full fees are paid', () => {
    renderGate(
      baseStatus({
        batches: [
          {
            batchId: 5,
            batchName: 'MERN',
            showProgramTab: true,
            lms: { completed: 4, total: 4, complete: true },
            program: { completed: 0, total: 2, complete: false },
            lectures,
            flowVariant: 'full',
          },
        ],
      }),
    )
    expect(
      screen.getByTestId('guided-tour-tab-program').getAttribute('data-locked'),
    ).toBe('false')
    expect(screen.queryByTestId('guided-tour-tab-program-lock')).toBeNull()
  })

  it('navigates steps via the step list (no Back/Next CTAs)', () => {
    renderGate(baseStatus())
    expect(screen.getByTestId('guided-tour-active-title').textContent).toBe(
      'Intro',
    )
    // Navigation is via the step list, not bottom Back/Next.
    expect(screen.queryByTestId('guided-tour-back')).toBeNull()
    expect(screen.queryByTestId('guided-tour-next')).toBeNull()

    fireEvent.click(screen.getByTestId('guided-tour-step-profile-photo'))
    expect(screen.getByTestId('guided-tour-active-title').textContent).toBe(
      'Add your profile photo',
    )
  })

  it('keeps the tour open and celebrates when onboarding completes mid-view', () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const { rerender } = render(
      <QueryClientProvider client={client}>
        <StatefulGate status={baseStatus()} />
      </QueryClientProvider>,
    )
    // Open and in progress: no completion celebration yet.
    expect(screen.getByTestId('guided-tour-overlay')).toBeTruthy()
    expect(screen.queryByTestId('guided-tour-complete-banner')).toBeNull()

    // Backend now reports onboarding complete (learner finished the last video).
    // The tour must stay open (latched) and show the congrats CTA instead of
    // being yanked away.
    rerender(
      <QueryClientProvider client={client}>
        <StatefulGate
          status={baseStatus({
            showGuidedTour: false,
            batches: [
              {
                batchId: 5,
                batchName: 'MERN',
                showProgramTab: false,
                lms: { completed: 4, total: 4, complete: true },
                program: null,
                lectures,
                flowVariant: 'full',
              },
            ],
          })}
        />
      </QueryClientProvider>,
    )
    expect(screen.getByTestId('guided-tour-overlay')).toBeTruthy()
    expect(screen.getByTestId('guided-tour-complete-banner')).toBeTruthy()
    // The congrats CTA closes the tour.
    fireEvent.click(screen.getByTestId('guided-tour-complete-cta'))
    expect(screen.queryByTestId('guided-tour-overlay')).toBeNull()
  })

  it('crosses from the last LMS step to Program Onboarding via Next when eligible', () => {
    renderGate(
      baseStatus({
        batches: [
          {
            batchId: 5,
            batchName: 'MERN',
            showProgramTab: true,
            lms: { completed: 1, total: 4, complete: false },
            program: { completed: 0, total: 2, complete: false },
            lectures,
            flowVariant: 'full',
          },
        ],
      }),
    )
    // Program tab starts unlocked but not selected.
    expect(
      screen
        .getByTestId('guided-tour-tab-program')
        .getAttribute('aria-selected'),
    ).toBe('false')

    // Advance through the LMS steps; the last one's Next crosses to the program.
    for (let i = 0; i < 10; i++) {
      const program = screen.getByTestId('guided-tour-tab-program')
      if (program.getAttribute('aria-selected') === 'true') break
      fireEvent.click(screen.getByTestId('guided-tour-step-next'))
    }
    expect(
      screen
        .getByTestId('guided-tour-tab-program')
        .getAttribute('aria-selected'),
    ).toBe('true')
  })

  it('shows a batch dropdown only for multi-batch users', async () => {
    renderGate(
      baseStatus({
        batches: [
          {
            batchId: 5,
            batchName: 'MERN',
            showProgramTab: false,
            lms: { completed: 1, total: 4, complete: false },
            program: null,
            lectures,
            flowVariant: 'full',
          },
          {
            batchId: 6,
            batchName: 'Data Analytics',
            showProgramTab: true,
            lms: { completed: 0, total: 3, complete: false },
            program: { completed: 0, total: 2, complete: false },
            lectures: null,
            flowVariant: 'full',
          },
        ],
      }),
    )
    await waitFor(() =>
      expect(screen.getByTestId('guided-tour-batch-select')).toBeTruthy(),
    )
    expect(screen.getByTestId('guided-tour-overlay')).toBeTruthy()
  })
})
