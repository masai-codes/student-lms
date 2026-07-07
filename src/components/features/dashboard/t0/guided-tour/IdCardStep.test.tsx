// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { IdCardStep } from './IdCardStep'

afterEach(cleanup)

describe('IdCardStep', () => {
  it('is locked until onboarding is complete', () => {
    render(<IdCardStep url="https://x/id.png" unlocked={false} />)
    expect(screen.getByTestId('id-card-locked')).toBeTruthy()
    expect(screen.queryByTestId('id-card-image')).toBeNull()
  })

  it('shows a "being generated" notice when unlocked but no url yet', () => {
    render(<IdCardStep url={null} unlocked />)
    expect(screen.getByTestId('id-card-generating')).toBeTruthy()
  })

  it('reveals the card image + download when unlocked with a url', () => {
    render(<IdCardStep url="https://x/id.png" unlocked />)
    expect(screen.getByTestId('id-card-image').getAttribute('src')).toBe('https://x/id.png')
    expect(screen.getByTestId<HTMLAnchorElement>('id-card-download').getAttribute('href')).toBe('https://x/id.png')
  })
})
