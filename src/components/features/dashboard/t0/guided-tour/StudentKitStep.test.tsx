// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StudentKitStep } from './StudentKitStep'
import type { StudentKitStatus } from '@/server/api/dashboard/t0/getStudentKitStatus.service'

const kit = (over: Partial<StudentKitStatus> = {}): StudentKitStatus => ({
  applicable: true,
  detailsFilled: false,
  trackingUrl: null,
  trackingId: null,
  admissionsFormUrl: 'https://sso/kit',
  ...over,
})

afterEach(cleanup)
beforeEach(() => vi.stubGlobal('open', vi.fn()))

describe('StudentKitStep', () => {
  it('offers the fill-details redirect when not filled', () => {
    render(<StudentKitStep kit={kit()} />)
    fireEvent.click(screen.getByTestId('student-kit-fill'))
    expect(window.open).toHaveBeenCalledWith(
      'https://sso/kit',
      '_blank',
      'noopener,noreferrer',
    )
  })

  it('shows a pending message once details are submitted', () => {
    render(<StudentKitStep kit={kit({ detailsFilled: true })} />)
    expect(screen.getByTestId('student-kit-pending')).toBeTruthy()
    expect(screen.queryByTestId('student-kit-fill')).toBeNull()
  })

  it('shows the tracking link once the kit ships', () => {
    render(
      <StudentKitStep
        kit={kit({ detailsFilled: true, trackingUrl: 'https://track/1' })}
      />,
    )
    expect(
      screen
        .getByTestId<HTMLAnchorElement>('student-kit-track')
        .getAttribute('href'),
    ).toBe('https://track/1')
  })
})
