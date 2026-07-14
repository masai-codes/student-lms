import { describe, expect, it } from 'vitest'

import { buildProblemDetailPayload } from '../buildProblemDetailPayload'

const problem = {
  elementId: 3,
  problemId: 12,
  title: 'Two Sum',
  statement: 'Solve it',
  type: 'LINK',
}

function build(overrides: {
  type?: string
  settings?: Record<string, unknown> | null
  solution?: {
    id: number
    submissionLink: string | null
    status: string | null
    submittedAt: string | null
  } | null
}) {
  return buildProblemDetailPayload({
    assignmentId: 99,
    assignmentTitle: 'Week 1 Assignment',
    settings: overrides.settings ?? null,
    problem: { ...problem, type: overrides.type ?? problem.type },
    solution: overrides.solution ?? null,
  })
}

describe('buildProblemDetailPayload', () => {
  it('marks LINK/FILE problems as accepting a submission', () => {
    expect(build({ type: 'LINK' }).acceptsSubmission).toBe(true)
    expect(build({ type: 'FILE' }).acceptsSubmission).toBe(true)
  })

  it('treats BUTTON (and unknown) problems as non-submitting', () => {
    expect(build({ type: 'BUTTON' }).acceptsSubmission).toBe(false)
    expect(build({ type: 'WEIRD' }).type).toBe('BUTTON')
    expect(build({ type: 'WEIRD' }).acceptsSubmission).toBe(false)
  })

  it('cannot submit when there is no solution row', () => {
    expect(build({ type: 'LINK', solution: null }).canSubmit).toBe(false)
  })

  it('can submit when a solution exists with no link yet', () => {
    const payload = build({
      type: 'LINK',
      solution: {
        id: 7,
        submissionLink: null,
        status: 'in-progress',
        submittedAt: null,
      },
    })

    expect(payload.canSubmit).toBe(true)
    expect(payload.solution).toEqual({
      id: 7,
      submissionLink: null,
      submittedAtLabel: null,
    })
  })

  it('hides the input once submitted unless multiple submissions are allowed', () => {
    const submitted = {
      id: 7,
      submissionLink: 'https://x.test',
      status: 'submitted',
      submittedAt: '2026-05-20 10:00:00',
    }

    expect(build({ type: 'LINK', solution: submitted }).canSubmit).toBe(false)
    expect(
      build({
        type: 'LINK',
        settings: { is_multiple_submissions_allowed: true },
        solution: submitted,
      }).canSubmit,
    ).toBe(true)
  })

  it('builds a submitted-at label only when a link is present', () => {
    const payload = build({
      type: 'FILE',
      solution: {
        id: 7,
        submissionLink: 'https://x.test/file.pdf',
        status: 'submitted',
        submittedAt: '2026-05-20 10:00:00',
      },
    })

    expect(payload.solution?.submittedAtLabel).not.toBeNull()
  })

  it('treats a blank submission link as no link', () => {
    const payload = build({
      type: 'LINK',
      solution: {
        id: 7,
        submissionLink: '   ',
        status: 'in-progress',
        submittedAt: null,
      },
    })

    expect(payload.solution?.submissionLink).toBeNull()
    expect(payload.solution?.submittedAtLabel).toBeNull()
  })
})
