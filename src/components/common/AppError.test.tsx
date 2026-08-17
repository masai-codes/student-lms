// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ErrorComponentProps } from '@tanstack/react-router'
import AppError from './AppError'

const invalidate = vi.fn()

// `useRouter` needs a real router context; the boundary only calls `invalidate`,
// so a stub is enough. Read lazily inside the factory (vitest hoists `vi.mock`
// above the `const` above, so referencing it eagerly would hit the TDZ).
vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({ invalidate }),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}))

// A DB outage surfaces as a raw mysql2 error; none of this may reach the screen.
const DB_ERROR = new Error(
  "connect ECONNREFUSED 127.0.0.1:3306 — Table 'lms.sessions'",
)

function renderError(overrides: Partial<ErrorComponentProps> = {}) {
  const props: ErrorComponentProps = {
    error: DB_ERROR,
    reset: vi.fn(),
    info: { componentStack: '' },
    ...overrides,
  }
  return render(<AppError {...props} />)
}

describe('AppError', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('shows a generic message instead of the raw error in production', () => {
    vi.stubEnv('DEV', false)
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const { container } = renderError()

    expect(screen.getByText('Something went wrong')).toBeTruthy()
    // No DB internals, and no dev details block to expand.
    expect(container.textContent).not.toContain('ECONNREFUSED')
    expect(container.textContent).not.toContain('lms.sessions')
    expect(screen.queryByTestId('app-error-details')).toBeNull()
  })

  it('does not echo the raw error into a production browser console', () => {
    vi.stubEnv('DEV', false)
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    renderError()

    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('logs the real error for ops in dev', () => {
    vi.stubEnv('DEV', true)
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    renderError()

    expect(errorSpy).toHaveBeenCalledWith('[app] route error:', DB_ERROR)
  })

  it('exposes the error details in dev', () => {
    vi.stubEnv('DEV', true)
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const { container } = renderError()

    expect(screen.getByTestId('app-error-details')).toBeTruthy()
    expect(container.textContent).toContain('ECONNREFUSED')
  })

  it('retries by invalidating the router and resetting the boundary', () => {
    vi.stubEnv('DEV', false)
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const reset = vi.fn()

    renderError({ reset })
    screen.getByTestId('app-error-retry').click()

    expect(invalidate).toHaveBeenCalled()
    expect(reset).toHaveBeenCalled()
  })
})
