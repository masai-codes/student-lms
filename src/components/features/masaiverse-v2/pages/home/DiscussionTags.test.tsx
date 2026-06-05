// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import DiscussionTags from './DiscussionTags'

afterEach(cleanup)

describe('DiscussionTags', () => {
  it('renders a pill per tag', () => {
    render(<DiscussionTags tags={['Career', 'Interviews']} />)
    expect(screen.getByText('Career')).toBeTruthy()
    expect(screen.getByText('Interviews')).toBeTruthy()
  })

  it('renders nothing when there are no tags', () => {
    const { container } = render(<DiscussionTags tags={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('gives the same tag a stable color across renders', () => {
    const { getByText: a } = render(<DiscussionTags tags={['Career']} />)
    const first = a('Career').getAttribute('style')
    cleanup()
    const { getByText: b } = render(<DiscussionTags tags={['Career']} />)
    expect(b('Career').getAttribute('style')).toBe(first)
  })
})
