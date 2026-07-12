// @vitest-environment jsdom
import { fireEvent, render, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { DiscussionListItem } from '@/server/learn/types'
import { LectureDiscussionsSection } from '../LectureDiscussionsSection'

const hoisted = vi.hoisted(() => ({
  invalidate: vi.fn(),
  createDiscussion: vi.fn(),
  routeContext: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({ invalidate: hoisted.invalidate }),
  useRouteContext: () => hoisted.routeContext(),
}))
vi.mock('@/lib/api/learn/discussionsApi', () => ({
  createLearnDiscussionViaApi: hoisted.createDiscussion,
}))
vi.mock('@/components/features/learn/shared/learnAnalytics', () => ({
  pushLearnEvent: vi.fn(),
  learnEntityEvent: (t: string, a: string, id: number) => `l_learn_${t}_${a}_id_${id}`,
}))
// Stub the create form (pulls in the rich-text editor) and the list item.
vi.mock('../LectureDiscussionCreatePanel', () => ({
  LectureDiscussionCreatePanel: () => <div data-testid="create-panel" />,
}))
vi.mock('../LectureDiscussionListItem', () => ({
  LectureDiscussionListItem: ({ discussion }: { discussion: DiscussionListItem }) => (
    <div data-testid={`discussion-item-${discussion.id}`}>{discussion.title}</div>
  ),
}))

function makeDiscussions(count: number, authorId: number): Array<DiscussionListItem> {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    title: `Discussion ${i + 1}`,
    messagePreview: 'body',
    isClosed: false,
    isPublic: true,
    createdAt: null,
    updatedAt: null,
    threadCount: 0,
    threads: [],
    author: { id: authorId, name: 'Author' },
  }))
}

describe('LectureDiscussionsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.routeContext.mockReturnValue({ user: { id: 10 } })
  })

  it('hides the toolbar and shows the empty state when there are no discussions', () => {
    const { container } = render(
      <LectureDiscussionsSection entityId={1} entityKind="lecture" discussions={[]} />,
    )
    const scope = within(container)
    expect(scope.queryByTestId('discussion-toolbar')).toBeNull()
    expect(scope.getByTestId('discussion-empty')).toBeTruthy()
    expect(scope.queryByTestId('discussion-pagination')).toBeNull()
  })

  it('paginates to 10 items per page and navigates', () => {
    const { container } = render(
      <LectureDiscussionsSection
        entityId={1}
        entityKind="lecture"
        discussions={makeDiscussions(12, 10)}
      />,
    )
    const scope = within(container)
    expect(scope.getByTestId('discussion-item-1')).toBeTruthy()
    expect(scope.queryByTestId('discussion-item-11')).toBeNull()
    expect(scope.getByTestId('discussion-pagination')).toBeTruthy()

    fireEvent.click(scope.getByLabelText('Go to page 2'))
    expect(scope.getByTestId('discussion-item-11')).toBeTruthy()
    expect(scope.queryByTestId('discussion-item-1')).toBeNull()
  })

  it('filters via the search input', () => {
    const { container } = render(
      <LectureDiscussionsSection
        entityId={1}
        entityKind="lecture"
        discussions={makeDiscussions(12, 10)}
      />,
    )
    const scope = within(container)
    fireEvent.change(scope.getByTestId('discussion-search-input'), {
      target: { value: 'Discussion 2' },
    })
    expect(scope.getByTestId('discussion-item-2')).toBeTruthy()
    expect(scope.queryByTestId('discussion-item-1')).toBeNull()
  })

  it('filters to the current user with the My Discussions toggle', () => {
    const mixed = [
      ...makeDiscussions(3, 10),
      ...makeDiscussions(2, 99).map((d) => ({ ...d, id: d.id + 100 })),
    ]
    const { container } = render(
      <LectureDiscussionsSection entityId={1} entityKind="lecture" discussions={mixed} />,
    )
    const scope = within(container)
    fireEvent.click(scope.getByTestId('discussion-mine-toggle'))
    expect(scope.getByTestId('discussion-item-1')).toBeTruthy()
    expect(scope.queryByTestId('discussion-item-101')).toBeNull()
  })

  it('shows no results under My Discussions when the user is unknown', () => {
    hoisted.routeContext.mockReturnValue({ user: null })
    const { container } = render(
      <LectureDiscussionsSection
        entityId={1}
        entityKind="lecture"
        discussions={makeDiscussions(3, 10)}
      />,
    )
    const scope = within(container)
    fireEvent.click(scope.getByTestId('discussion-mine-toggle'))
    expect(scope.getByTestId('discussion-empty-filtered')).toBeTruthy()
  })
})
