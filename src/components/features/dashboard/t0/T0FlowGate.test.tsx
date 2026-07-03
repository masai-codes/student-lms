// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { T0FlowGate } from './T0FlowGate'
import type { T0FlowStatus } from '@/server/api/dashboard/getT0FlowStatus.service'

const hoisted = vi.hoisted(() => ({ fetchStatus: vi.fn(), fetchLectures: vi.fn() }))

vi.mock('@/lib/api/dashboard/dashboardApi', () => ({
  fetchT0FlowStatus: hoisted.fetchStatus,
  fetchT0FlowLectures: hoisted.fetchLectures,
}))
// The media-chrome player isn't the unit under test — stub it.
vi.mock('./guided-tour/GuidedTourVideoStep', () => ({
  GuidedTourVideoStep: () => <div data-testid="guided-tour-video-stub" />,
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

const baseStatus = (over: Partial<T0FlowStatus> = {}): T0FlowStatus => ({
  showT0Flow: true,
  batches: [
    { batchId: 5, batchName: 'MERN', showProgramTab: false, lms: { completed: 1, total: 4, complete: false }, program: null },
  ],
  profilePhotoUrl: null,
  downloadAppCompleted: false,
  showGuidedTour: true,
  ...over,
})

const lectures = {
  lmsLectures: [{ id: 'a', lectureId: 1, title: 'Intro', videoUrl: 'v', lectureType: 'video' }],
  programLectures: [],
  completedLectureIds: [],
  legalAgreementSections: [],
  isDocumentsRequired: false,
  isStudentKitApplicable: false,
  idCardUrl: null,
}

beforeEach(() => {
  hoisted.fetchLectures.mockResolvedValue(lectures)
})

function renderGate() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <T0FlowGate />
    </QueryClientProvider>,
  )
}

describe('T0FlowGate', () => {
  it('renders nothing when the backend says not to show the tour', async () => {
    hoisted.fetchStatus.mockResolvedValue(baseStatus({ showGuidedTour: false }))
    renderGate()
    await waitFor(() => expect(hoisted.fetchStatus).toHaveBeenCalled())
    expect(screen.queryByTestId('guided-tour-overlay')).toBeNull()
  })

  it('shows the tour with progress + steps when eligible', async () => {
    hoisted.fetchStatus.mockResolvedValue(baseStatus())
    renderGate()
    await waitFor(() => expect(screen.getByTestId('guided-tour-overlay')).toBeTruthy())
    expect(screen.getByTestId('guided-tour-progress-label').textContent).toBe('1/4')
    await waitFor(() => expect(screen.getByTestId('guided-tour-step-lecture-1')).toBeTruthy())
    expect(screen.getByTestId('guided-tour-step-profile-photo')).toBeTruthy()
    // Program tab hidden when full fees unpaid.
    expect(screen.queryByTestId('guided-tour-tab-program')).toBeNull()
  })

  it('hides the tour after "See dashboard"', async () => {
    hoisted.fetchStatus.mockResolvedValue(baseStatus())
    renderGate()
    await waitFor(() => expect(screen.getByTestId('guided-tour-overlay')).toBeTruthy())
    fireEvent.click(screen.getByTestId('guided-tour-see-dashboard'))
    expect(screen.queryByTestId('guided-tour-overlay')).toBeNull()
  })

  it('unlocks the Program Onboarding tab when full fees are paid', async () => {
    hoisted.fetchStatus.mockResolvedValue(
      baseStatus({
        batches: [
          { batchId: 5, batchName: 'MERN', showProgramTab: true, lms: { completed: 4, total: 4, complete: true }, program: { completed: 0, total: 2, complete: false } },
        ],
      }),
    )
    renderGate()
    await waitFor(() => expect(screen.getByTestId('guided-tour-tab-program')).toBeTruthy())
  })
})
