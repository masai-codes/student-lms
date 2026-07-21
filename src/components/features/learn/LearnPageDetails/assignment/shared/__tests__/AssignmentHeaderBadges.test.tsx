// @vitest-environment jsdom
import { render, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AssignmentHeaderBadges } from '../AssignmentHeaderBadges'

describe('AssignmentHeaderBadges', () => {
  it('renders nothing when there are no badges', () => {
    const { container } = render(<AssignmentHeaderBadges badges={[]} />)

    expect(container.firstChild).toBeNull()
  })

  it('renders the deadline-enforced badge', () => {
    const { container } = render(
      <AssignmentHeaderBadges
        badges={[{ kind: 'deadline-enforced', label: 'Deadline Enforced' }]}
      />,
    )
    const scope = within(container)

    expect(
      scope.getByTestId('assignment-header-badge-deadline-enforced')
        .textContent,
    ).toContain('Deadline Enforced')
  })

  it('renders the weightage badge', () => {
    const { container } = render(
      <AssignmentHeaderBadges
        badges={[{ kind: 'weightage', label: '20% Weightage' }]}
      />,
    )
    const scope = within(container)

    expect(
      scope.getByTestId('assignment-header-badge-weightage').textContent,
    ).toContain('20% Weightage')
  })

  it('renders both badges together', () => {
    const { container } = render(
      <AssignmentHeaderBadges
        badges={[
          { kind: 'deadline-enforced', label: 'Deadline Enforced' },
          { kind: 'weightage', label: '15% Weightage' },
        ]}
      />,
    )
    const scope = within(container)

    expect(
      scope.getByTestId('assignment-header-badge-deadline-enforced'),
    ).toBeTruthy()
    expect(scope.getByTestId('assignment-header-badge-weightage')).toBeTruthy()
  })
})
