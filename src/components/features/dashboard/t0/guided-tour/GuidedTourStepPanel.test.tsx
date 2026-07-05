// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GuidedTourStepPanel } from './GuidedTourStepPanel'
import type { GuidedTourStep } from './steps'
import type { StudentKitStatus } from '@/server/api/dashboard/t0/getStudentKitStatus.service'

const kit: StudentKitStatus = { applicable: true, detailsFilled: false, trackingUrl: null, trackingId: null, admissionsFormUrl: 'https://sso/kit' }

function renderPanel(step: GuidedTourStep) {
  render(<GuidedTourStepPanel step={step} batchId={5} profilePhotoUrl={null} onCompleted={vi.fn()} />)
}

afterEach(cleanup)

describe('GuidedTourStepPanel — agreement lock', () => {
  it('locks the documents step until the agreement is signed', () => {
    renderPanel({ key: 'documents', kind: 'fixed', title: 'Upload your documents', completed: false, action: 'documents', locked: true })
    expect(screen.getByTestId('guided-tour-locked-notice')).toBeTruthy()
    expect(screen.queryByTestId('document-upload-step')).toBeNull()
  })

  it('locks the student-kit step until the agreement is signed', () => {
    renderPanel({ key: 'student-kit', kind: 'fixed', title: 'Track your student kit', completed: false, action: 'student-kit', studentKit: kit, locked: true })
    expect(screen.getByTestId('guided-tour-locked-notice')).toBeTruthy()
    expect(screen.queryByTestId('student-kit-step')).toBeNull()
  })

  it('renders the kit step when unlocked', () => {
    renderPanel({ key: 'student-kit', kind: 'fixed', title: 'Track your student kit', completed: false, action: 'student-kit', studentKit: kit, locked: false })
    expect(screen.getByTestId('student-kit-step')).toBeTruthy()
    expect(screen.queryByTestId('guided-tour-locked-notice')).toBeNull()
  })
})
