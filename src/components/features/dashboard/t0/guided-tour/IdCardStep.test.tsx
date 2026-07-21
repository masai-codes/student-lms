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

  it('reveals the card image + download when unlocked with an image url', () => {
    render(<IdCardStep url="https://x/id.png" unlocked />)
    expect(screen.getByTestId('id-card-image').getAttribute('src')).toBe(
      'https://x/id.png',
    )
    expect(screen.queryByTestId('id-card-pdf')).toBeNull()
    const link = screen.getByTestId<HTMLAnchorElement>('id-card-download')
    expect(link.getAttribute('href')).toBe('https://x/id.png')
    expect(link.getAttribute('download')).toBe('masai-id-card.png')
  })

  it('embeds a PDF admit card in an iframe (not an img) with a .pdf download', () => {
    const url = 'https://s3/welcome-kit/admit-cards/543229-admit-card.pdf'
    render(<IdCardStep url={url} unlocked />)
    expect(screen.queryByTestId('id-card-image')).toBeNull()
    expect(screen.getByTestId('id-card-pdf').getAttribute('src')).toBe(
      `${url}#toolbar=0`,
    )
    const link = screen.getByTestId<HTMLAnchorElement>('id-card-download')
    expect(link.getAttribute('href')).toBe(url)
    expect(link.getAttribute('download')).toBe('masai-id-card.pdf')
  })

  it('treats a .pdf url with a query string as a PDF', () => {
    render(<IdCardStep url="https://s3/card.pdf?sig=abc" unlocked />)
    expect(screen.getByTestId('id-card-pdf')).toBeTruthy()
    expect(screen.queryByTestId('id-card-image')).toBeNull()
  })
})
