// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { AssociatedContentList } from '../AssociatedContentList'

describe('AssociatedContentList', () => {
  it('opens linked learn entities in a new tab', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

    render(
      <AssociatedContentList
        items={[
          { id: 10, kind: 'lecture', title: 'Intro', meta: 'Today' },
        ]}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /intro/i }))

    expect(openSpy).toHaveBeenCalledWith(
      '/lectures/10',
      '_blank',
      'noopener,noreferrer',
    )

    openSpy.mockRestore()
  })
})
