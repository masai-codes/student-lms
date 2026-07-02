// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { LmsSupportPanel } from './LmsSupportPanel'

afterEach(cleanup)

describe('LmsSupportPanel', () => {
  it('renders the support session call-to-action', () => {
    render(<LmsSupportPanel />)
    expect(screen.getByRole('button', { name: /LMS Support Session/ })).toBeTruthy()
    expect(screen.getByText(/join our daily session/i)).toBeTruthy()
  })
})
