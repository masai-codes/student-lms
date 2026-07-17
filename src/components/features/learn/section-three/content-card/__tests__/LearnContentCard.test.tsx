// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
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

const pushLearnEvent = vi.hoisted(() => vi.fn())
vi.mock('../../../shared/learnAnalytics', () => ({
  pushLearnEvent,
  learnEntityEvent: (type: string, action: string, id: number) =>
    `l_learn_${type}_${action}_id_${id}`,
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
    optionalAttendance: null,
    assignmentProgressStatus: null,
    resourcePhase: null,
    listingCtas: {
      joinLive: 'hidden',
      joinZoomLink: null,
      isNewZoomRedirection: false,
      enableZoomWebView: false,
      showAttendance: false,
      assignmentStatusChip: null,
      assignmentDeadlineLabel: null,
      assignmentScore: null,
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

  it('shows the assignment deadline label when present', () => {
    const item = {
      ...makeItem('assignment', 'mandatory'),
      assignmentDeadlineLabel: '2 days remaining',
    }
    render(<LearnContentCard item={item} />)
    expect(screen.getByTestId('learn-assignment-deadline').textContent).toBe(
      '2 days remaining',
    )
  })

  it('renders no deadline label for lectures / when absent', () => {
    render(<LearnContentCard item={makeItem('assignment', 'mandatory')} />)
    expect(screen.queryByTestId('learn-assignment-deadline')).toBeNull()
  })
})

describe('LearnContentCard — analytics source', () => {
  afterEach(() => {
    cleanup()
    pushLearnEvent.mockClear()
  })

  it('tags the click event source as "associated" when rendered in associated content', () => {
    render(
      <LearnContentCard
        item={makeItem('lecture', 'mandatory')}
        isAssociatedCard
      />,
    )
    fireEvent.click(screen.getByText('Intro to React'))
    expect(pushLearnEvent).toHaveBeenCalledWith(
      'l_learn_lecture_card_click_id_1',
      expect.objectContaining({ source: 'associated' }),
    )
  })

  it('defaults the source to "learn_listing"', () => {
    render(<LearnContentCard item={makeItem('assignment', 'mandatory')} />)
    fireEvent.click(screen.getByText('Intro to React'))
    expect(pushLearnEvent).toHaveBeenCalledWith(
      'l_learn_assignment_card_click_id_1',
      expect.objectContaining({ source: 'learn_listing' }),
    )
  })
})

describe('LearnContentCard — associated (drawer) layout', () => {
  afterEach(() => cleanup())

  it('stays in the stacked mobile layout so it fits a narrow drawer', () => {
    render(
      <LearnContentCard
        item={makeItem('lecture', 'mandatory')}
        isAssociatedCard
      />,
    )
    const outer = screen.getByText('Intro to React').closest('a')!
      .firstElementChild as HTMLElement
    expect(outer.className).toContain('flex-col')
    expect(outer.className).not.toContain('md:flex-row')
  })

  it('keeps the desktop row split when not associated', () => {
    render(<LearnContentCard item={makeItem('lecture', 'mandatory')} />)
    const outer = screen.getByText('Intro to React').closest('a')!
      .firstElementChild as HTMLElement
    expect(outer.className).toContain('md:flex-row')
  })
})

describe('LearnContentCard — dashboard compact layout', () => {
  afterEach(() => cleanup())

  it('splits time+course and tags into separate rows so tags do not stack per-line', () => {
    render(
      <LearnContentCard
        item={makeItem('lecture', 'mandatory')}
        fromDashboard
      />,
    )
    const tagsRow = screen.getByTestId('learn-card-dashboard-tags')
    const metaRoot = screen.getByTestId('learn-card-dashboard-meta')
    // Tags live in their own row, not interleaved with the time text.
    expect(metaRoot.contains(tagsRow)).toBe(true)
    expect(tagsRow.textContent).toContain('coding')
    expect(tagsRow.textContent).not.toContain('12 Jun')
  })

  it('omits the tags row when there are no tags', () => {
    const item = { ...makeItem('lecture', 'mandatory'), tags: [] }
    render(<LearnContentCard item={item} fromDashboard />)
    expect(screen.getByTestId('learn-card-dashboard-meta')).toBeTruthy()
    expect(screen.queryByTestId('learn-card-dashboard-tags')).toBeNull()
  })
})
