// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  cleanup,
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type * as TanstackRouter from '@tanstack/react-router'
import type { MyCoursesData } from '@/server/api/courses/getMyCourses.service'
import { MyCoursesPage } from './MyCoursesPage'

const hoisted = vi.hoisted(() => ({ fetchMyCourses: vi.fn() }))

vi.mock('@/lib/api/courses/coursesApi', () => ({
  fetchMyCourses: hoisted.fetchMyCourses,
}))
vi.mock('@/utils/gtm', () => ({ pushGtmEvent: vi.fn() }))
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof TanstackRouter>()
  return {
    ...actual,
    Link: ({
      children,
      to,
      params,
      ...props
    }: Record<string, unknown> & { children?: React.ReactNode }) => (
      <a
        data-to={String(to)}
        data-batch-id={(params as { batchId?: string } | undefined)?.batchId}
        {...props}
      >
        {children}
      </a>
    ),
  }
})

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MyCoursesPage />
    </QueryClientProvider>,
  )
}

const DATA: MyCoursesData = {
  active: [
    {
      batchId: 10,
      courseTitle: 'AI & Machine Learning',
      instituteName: 'IIT Patna',
      courseLogo: null,
      courseProgress: 60,
      showBatchDetails: true,
    },
    {
      batchId: 20,
      courseTitle: 'Full Stack Web Development',
      instituteName: 'Masai',
      courseLogo: null,
      courseProgress: 0,
      showBatchDetails: false,
    },
  ],
  cancelled: [],
}

describe('MyCoursesPage', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(cleanup)

  it('shows a skeleton while loading, then the program grid', async () => {
    hoisted.fetchMyCourses.mockResolvedValue(DATA)
    renderPage()

    expect(screen.getByTestId('my-courses-skeleton')).toBeTruthy()
    await waitForElementToBeRemoved(() =>
      screen.queryByTestId('my-courses-skeleton'),
    )

    expect(screen.getByTestId('my-courses-grid')).toBeTruthy()
    expect(screen.getByTestId('my-courses-card-10')).toBeTruthy()
    expect(screen.getByTestId('my-courses-card-20')).toBeTruthy()
    expect(screen.getByTestId('my-courses-heading').textContent).toBe(
      'My Programs',
    )
  })

  it('links a details-enabled program and leaves a details-disabled one inert', async () => {
    hoisted.fetchMyCourses.mockResolvedValue(DATA)
    renderPage()

    await screen.findByTestId('my-courses-card-10')

    expect(screen.getByTestId('my-courses-card-10').getAttribute('data-to')).toBe(
      '/course/$batchId',
    )
    expect(screen.getByTestId('my-courses-card-20').tagName).toBe('DIV')
  })

  it('shows the empty state when there are no programs at all', async () => {
    hoisted.fetchMyCourses.mockResolvedValue({ active: [], cancelled: [] })
    renderPage()

    await screen.findByTestId('my-courses-empty-state')
    expect(screen.queryByTestId('my-courses-grid')).toBeNull()
    expect(screen.queryByTestId('my-courses-cancelled-section')).toBeNull()
  })

  it('shows the cancelled section, and no empty state, when only cancelled programs exist', async () => {
    hoisted.fetchMyCourses.mockResolvedValue({
      active: [],
      cancelled: [
        {
          batchId: 30,
          courseTitle: 'Data Analytics',
          instituteName: 'Masai',
          courseLogo: null,
          cancelledOn: '2026-07-01',
        },
      ],
    })
    renderPage()

    await screen.findByTestId('my-courses-cancelled-section')
    expect(screen.getByTestId('my-courses-cancelled-card-30')).toBeTruthy()
    expect(screen.queryByTestId('my-courses-empty-state')).toBeNull()
    expect(screen.queryByTestId('my-courses-grid')).toBeNull()
  })

  it('hides the cancelled section when there are none', async () => {
    hoisted.fetchMyCourses.mockResolvedValue(DATA)
    renderPage()

    await screen.findByTestId('my-courses-grid')
    expect(screen.queryByTestId('my-courses-cancelled-section')).toBeNull()
  })

  it('shows an error state, not an empty state, when the request fails', async () => {
    hoisted.fetchMyCourses.mockRejectedValue(new Error('boom'))
    renderPage()

    await waitFor(() =>
      expect(screen.getByTestId('my-courses-error-state')).toBeTruthy(),
    )
    expect(screen.queryByTestId('my-courses-empty-state')).toBeNull()
    expect(screen.queryByTestId('my-courses-grid')).toBeNull()
  })
})
