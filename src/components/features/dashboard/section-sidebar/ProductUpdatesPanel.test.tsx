// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ProductUpdatesPanel } from './ProductUpdatesPanel'
import type { ProductUpdate } from '../shared/types'

afterEach(cleanup)

const updates: Array<ProductUpdate> = [
  { id: '1', title: 'New feature A' },
  { id: '2', title: 'New feature B' },
]

describe('ProductUpdatesPanel', () => {
  it('renders each update as an actionable row', () => {
    render(<ProductUpdatesPanel updates={updates} />)
    expect(screen.getByRole('button', { name: /New feature A/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /New feature B/ })).toBeTruthy()
  })

  it('renders the empty state when there are no updates', () => {
    render(<ProductUpdatesPanel updates={[]} />)
    expect(screen.getByText(/no updates right now/i)).toBeTruthy()
  })
})
