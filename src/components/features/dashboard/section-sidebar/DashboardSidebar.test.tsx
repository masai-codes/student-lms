// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { DashboardSidebar } from './DashboardSidebar'

afterEach(cleanup)

describe('DashboardSidebar', () => {
  it('composes the announcements, product updates and support panels', () => {
    render(
      <DashboardSidebar
        announcements={[{ id: '1', title: 'Notice', author: 'Prof', isForYou: false }]}
        productUpdates={[{ id: '1', title: 'Update' }]}
      />,
    )
    expect(screen.getByText('Announcements')).toBeTruthy()
    expect(screen.getByText('Product Updates')).toBeTruthy()
    expect(screen.getByRole('button', { name: /LMS Support Session/ })).toBeTruthy()
  })
})
