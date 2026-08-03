// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type * as TanstackRouter from '@tanstack/react-router'

import { LearnHeaderSection } from '../LearnHeaderSection'

const hoisted = vi.hoisted(() => ({
  getOldStudentUiUrlForPath: vi.fn(),
  fetchLearnPageDataFromApi: vi.fn(),
}))

vi.mock('@/utils/authRedirect', () => ({
  getOldStudentUiUrlForPath: hoisted.getOldStudentUiUrlForPath,
}))
vi.mock('@/lib/api/learn/learnApi', () => ({
  fetchLearnPageDataFromApi: hoisted.fetchLearnPageDataFromApi,
}))
vi.mock('@/components/ui/masai-drawer', () => ({
  MasaiDrawer: () => null,
}))
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof TanstackRouter>()
  return {
    ...actual,
    getRouteApi: () => ({
      useRouteContext: () => ({ user: { id: '1' } }),
    }),
    useNavigate: () => vi.fn(),
  }
})

function renderHeader(showBatchDetails: boolean) {
  hoisted.fetchLearnPageDataFromApi.mockResolvedValue({
    batches: [
      {
        batchId: 133,
        courseTitle: 'Full Stack Web',
        courseLogo: null,
        showAttendanceReport: false,
        showEvaluationReport: false,
        showBatchDetails,
        showSectionDropdown: false,
      },
    ],
    selectedBatchId: 133,
  })
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <LearnHeaderSection />
    </QueryClientProvider>,
  )
}

function courseDetailsLink() {
  return screen.queryByTestId('program-details-link')
}

describe('LearnHeaderSection — Course Details link', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('links to the resolved legacy course page (new tab) when the batch opts in', async () => {
    hoisted.getOldStudentUiUrlForPath.mockReturnValue(
      'https://old.example.com/new-courses/133',
    )
    renderHeader(true)

    const link = await screen.findByTestId('program-details-link')
    expect(hoisted.getOldStudentUiUrlForPath).toHaveBeenCalledWith(
      '/new-courses/133',
    )
    expect(link.getAttribute('href')).toBe(
      'https://old.example.com/new-courses/133',
    )
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('hides Course Details when the batch has showBatchDetails = false', async () => {
    hoisted.getOldStudentUiUrlForPath.mockReturnValue(
      'https://old.example.com/new-courses/133',
    )
    renderHeader(false)

    await screen.findByText('Full Stack Web')
    expect(courseDetailsLink()).toBeNull()
    // Gated before resolving the URL — the resolver is never consulted.
    expect(hoisted.getOldStudentUiUrlForPath).not.toHaveBeenCalled()
  })

  it('hides Course Details when the legacy URL is not configured', async () => {
    hoisted.getOldStudentUiUrlForPath.mockReturnValue(undefined)
    renderHeader(true)

    await screen.findByText('Full Stack Web')
    expect(courseDetailsLink()).toBeNull()
  })
})
