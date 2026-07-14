import { describe, expect, it } from 'vitest'

import { buildAssignmentHeaderBadges } from '../buildAssignmentHeaderBadges'

describe('buildAssignmentHeaderBadges', () => {
  it('returns no badges when nothing applies', () => {
    expect(
      buildAssignmentHeaderBadges({
        assignmentKind: 'assignment',
        enforceDeadline: false,
        settings: null,
      }),
    ).toEqual([])
  })

  it('adds the deadline-enforced badge when the deadline is enforced', () => {
    const badges = buildAssignmentHeaderBadges({
      assignmentKind: 'assignment',
      enforceDeadline: true,
      settings: null,
    })

    expect(badges).toEqual([
      { kind: 'deadline-enforced', label: 'Deadline Enforced' },
    ])
  })

  it('adds a weightage badge for evaluations with a positive percentage', () => {
    const badges = buildAssignmentHeaderBadges({
      assignmentKind: 'evaluation',
      enforceDeadline: false,
      settings: { weightagePercentage: 30 },
    })

    expect(badges).toEqual([{ kind: 'weightage', label: '30% Weightage' }])
  })

  it('coerces a string weightage percentage', () => {
    const badges = buildAssignmentHeaderBadges({
      assignmentKind: 'evaluation',
      enforceDeadline: false,
      settings: { weightagePercentage: '25' },
    })

    expect(badges).toEqual([{ kind: 'weightage', label: '25% Weightage' }])
  })

  it('omits weightage for non-evaluation assignments', () => {
    expect(
      buildAssignmentHeaderBadges({
        assignmentKind: 'practice',
        enforceDeadline: false,
        settings: { weightagePercentage: 40 },
      }),
    ).toEqual([])
  })

  it('omits weightage when the percentage is zero, negative, or invalid', () => {
    for (const weightagePercentage of [0, -5, 'abc', null]) {
      expect(
        buildAssignmentHeaderBadges({
          assignmentKind: 'evaluation',
          enforceDeadline: false,
          settings: { weightagePercentage },
        }),
      ).toEqual([])
    }
  })

  it('orders deadline-enforced before weightage', () => {
    const badges = buildAssignmentHeaderBadges({
      assignmentKind: 'evaluation',
      enforceDeadline: true,
      settings: { weightagePercentage: 15 },
    })

    expect(badges.map((badge) => badge.kind)).toEqual([
      'deadline-enforced',
      'weightage',
    ])
  })
})
