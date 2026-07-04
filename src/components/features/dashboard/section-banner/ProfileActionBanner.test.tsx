// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProfileActionBanner } from './ProfileActionBanner'

afterEach(cleanup)

describe('ProfileActionBanner', () => {
  it('renders the label and default action text', () => {
    render(<ProfileActionBanner label="Complete your profile" />)
    expect(screen.getByText('Complete your profile')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Take Photo' })).toBeTruthy()
  })

  it('supports a custom action label and fires the action handler', () => {
    const onAction = vi.fn()
    render(
      <ProfileActionBanner label="Add photo" actionLabel="Upload" onAction={onAction} />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }))
    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it('exposes accessible navigation controls', () => {
    render(<ProfileActionBanner label="Add photo" />)
    expect(screen.getByRole('button', { name: 'Previous banner' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Next banner' })).toBeTruthy()
  })
})
