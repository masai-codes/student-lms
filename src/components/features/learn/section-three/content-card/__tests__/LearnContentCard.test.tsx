// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { LearnContentCard } from '../LearnContentCard'
import type {
  LearnContentItem,
  LearnContentType,
  LearnPriority,
} from '../../../shared/types'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    ...props
  }: {
    children: React.ReactNode
    [key: string]: unknown
  }) => <a {...props}>{children}</a>,
}))

function makeItem(
  type: LearnContentType,
  priority: LearnPriority,
): LearnContentItem {
  return {
    id: 1,
    type,
    title: 'Intro to React',
    hostName: 'Ananya Singh',
    date: '12 Jun, 5:00 PM',
    category: 'coding',
    learningSubType: type === 'resource' ? 'reading' : 'live',
    priority,
    tags: ['live', 'coding', 'Module 1'],
    attendance: null,
    assignmentProgressStatus: null,
    resourcePhase: null,
    listingCtas: {
      joinLive: 'hidden',
      showAttendance: false,
      assignmentStatusChip: null,
    },
    assignmentStatusChip: null,
  }
}

describe('LearnContentCard — Optional session tag', () => {
  afterEach(() => cleanup())

  it('shows the "Optional session" tag for an optional (recommended) lecture', () => {
    render(<LearnContentCard item={makeItem('lecture', 'recommended')} />)
    expect(screen.getByText('Optional session')).toBeTruthy()
  })

  it('hides the tag for a mandatory lecture', () => {
    render(<LearnContentCard item={makeItem('lecture', 'mandatory')} />)
    expect(screen.queryByText('Optional session')).toBeNull()
  })

  it('hides the tag for an optional resource (lectures only)', () => {
    render(<LearnContentCard item={makeItem('resource', 'recommended')} />)
    expect(screen.queryByText('Optional session')).toBeNull()
  })
})
