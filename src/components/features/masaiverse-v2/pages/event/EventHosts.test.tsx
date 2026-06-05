// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import EventHosts from './EventHosts'

afterEach(cleanup)

describe('EventHosts', () => {
  it('renders nothing when there are no hosts', () => {
    const { container } = render(<EventHosts hosts={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders each host name with an avatar image when present', () => {
    render(
      <EventHosts
        hosts={[{ name: 'Aman Kumar', imageUrl: 'https://cdn/aman.png' }]}
      />,
    )
    expect(screen.getByText('Hosted By')).toBeTruthy()
    expect(screen.getByText('Aman Kumar')).toBeTruthy()
    const image = screen.getByAltText<HTMLImageElement>('Aman Kumar')
    expect(image.src).toBe('https://cdn/aman.png')
  })

  it('falls back to initials when a host has no avatar', () => {
    render(<EventHosts hosts={[{ name: 'Priya Rao', imageUrl: null }]} />)
    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByText('PR')).toBeTruthy()
    expect(screen.getByText('Priya Rao')).toBeTruthy()
  })

  it('lists multiple hosts in order', () => {
    render(
      <EventHosts
        hosts={[
          { name: 'Aman Kumar', imageUrl: null },
          { name: 'Sam Niko', imageUrl: null },
        ]}
      />,
    )
    const names = screen.getAllByRole('listitem').map((li) => li.textContent)
    expect(names[0]).toContain('Aman Kumar')
    expect(names[1]).toContain('Sam Niko')
  })
})
