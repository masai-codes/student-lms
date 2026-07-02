// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ScheduleCard } from './ScheduleCard'
import type { ScheduleItem } from '../shared/types'

afterEach(cleanup)

const baseItem: ScheduleItem = {
  id: 'i1',
  type: 'lecture',
  title: 'Interactive Programming Workshop',
  timeLabel: '10AM - 11:30 AM',
  courseCode: 'IIM-M DM',
  category: 'Tutorial',
  module: 'Module 1',
}

describe('ScheduleCard', () => {
  it('renders the title and all meta fields', () => {
    render(<ScheduleCard item={baseItem} />)
    expect(screen.getByText(baseItem.title)).toBeTruthy()
    expect(screen.getByText('10AM - 11:30 AM')).toBeTruthy()
    expect(screen.getByText('IIM-M DM')).toBeTruthy()
    expect(screen.getByText('Tutorial')).toBeTruthy()
    expect(screen.getByText('Module 1')).toBeTruthy()
  })
})
