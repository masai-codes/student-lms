// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import EventAttendees from './EventAttendees'

afterEach(cleanup)

describe('EventAttendees', () => {
  it('renders nothing when nobody has registered', () => {
    const { container } = render(<EventAttendees count={0} />)
    expect(container.firstChild).toBeNull()
  })

  it('shows a prominent count with the singular noun for one attendee', () => {
    render(<EventAttendees count={1} />)
    const block = screen.getByLabelText('1 person registered')
    expect(block).toBeTruthy()
    expect(screen.getByText('1')).toBeTruthy()
    expect(screen.getByText('person registered')).toBeTruthy()
  })

  it('uses the plural noun and a localised count for many attendees', () => {
    render(<EventAttendees count={1234} />)
    expect(screen.getByLabelText('1,234 people registered')).toBeTruthy()
    expect(screen.getByText('1,234')).toBeTruthy()
    expect(screen.getByText('people registered')).toBeTruthy()
  })

  it('caps the decorative bubbles at four regardless of count', () => {
    const { container } = render(<EventAttendees count={50} />)
    const bubbleRow = container.querySelector('[aria-hidden="true"]')
    expect(bubbleRow?.childElementCount).toBe(4)
  })
})
