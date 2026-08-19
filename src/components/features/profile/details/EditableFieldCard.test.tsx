// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EditableFieldCard } from './EditableFieldCard'
import type { EditableFieldCardProps } from './EditableFieldCard'

const hoisted = vi.hoisted(() => ({ pushGtmEvent: vi.fn() }))
vi.mock('@/utils/gtm', () => ({ pushGtmEvent: hoisted.pushGtmEvent }))

function setup(overrides: Partial<EditableFieldCardProps> = {}) {
  const props: EditableFieldCardProps = {
    fieldKey: 'name',
    label: 'Name',
    value: 'Riya',
    isEditing: false,
    isSaving: false,
    isDimmed: false,
    onEdit: vi.fn(),
    onCancel: vi.fn(),
    onSave: vi.fn(),
    ...overrides,
  }
  return { props, ...render(<EditableFieldCard {...props} />) }
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('EditableFieldCard — read mode', () => {
  it('shows the saved value and an Edit affordance', () => {
    setup()
    expect(screen.getByTestId('profile-field-name-value').textContent).toBe(
      'Riya',
    )
    expect(screen.getByTestId('profile-field-name-edit')).toBeTruthy()
    expect(screen.queryByTestId('profile-field-name-input')).toBeNull()
  })

  it('shows a "Not set" placeholder for an empty value', () => {
    setup({ value: '' })
    expect(screen.getByTestId('profile-field-name-value').textContent).toBe(
      'Not set',
    )
  })

  it('opens editing and fires an analytics event on Edit', () => {
    const { props } = setup()
    fireEvent.click(screen.getByTestId('profile-field-name-edit'))
    expect(props.onEdit).toHaveBeenCalled()
    expect(hoisted.pushGtmEvent).toHaveBeenCalledWith(
      'l_profile_field_edit_open',
      { field: 'name' },
    )
  })

  it('is genuinely inert while another field is being edited', () => {
    setup({ isDimmed: true })
    const card = screen.getByTestId('profile-field-name')
    expect(card.getAttribute('aria-disabled')).toBe('true')
    expect(card.className).toContain('pointer-events-none')
    expect(
      screen.getByTestId<HTMLButtonElement>('profile-field-name-edit').disabled,
    ).toBe(true)
  })
})

describe('EditableFieldCard — edit mode', () => {
  it('seeds the input with the saved value and hides Edit', () => {
    setup({ isEditing: true })
    expect(
      screen.getByTestId<HTMLInputElement>('profile-field-name-input').value,
    ).toBe('Riya')
    expect(screen.queryByTestId('profile-field-name-edit')).toBeNull()
  })

  it('saves the current draft', () => {
    const { props } = setup({ isEditing: true })
    fireEvent.change(screen.getByTestId('profile-field-name-input'), {
      target: { value: 'Riya Sharma' },
    })
    fireEvent.click(screen.getByTestId('profile-field-name-save'))

    expect(props.onSave).toHaveBeenCalledWith('Riya Sharma')
    expect(hoisted.pushGtmEvent).toHaveBeenCalledWith('l_profile_field_save', {
      field: 'name',
    })
  })

  it('cancels without saving', () => {
    const { props } = setup({ isEditing: true })
    fireEvent.click(screen.getByTestId('profile-field-name-cancel'))
    expect(props.onCancel).toHaveBeenCalled()
    expect(props.onSave).not.toHaveBeenCalled()
  })

  it('shows the hint until a validation error takes over', () => {
    setup({
      isEditing: true,
      value: '',
      hint: () => 'Indian numbers are 10 digits',
      validate: (draft) => (draft === 'bad' ? 'Not valid' : undefined),
    })

    expect(screen.getByTestId('profile-field-name-hint').textContent).toBe(
      'Indian numbers are 10 digits',
    )

    fireEvent.change(screen.getByTestId('profile-field-name-input'), {
      target: { value: 'bad' },
    })
    expect(screen.getByTestId('profile-field-name-error').textContent).toBe(
      'Not valid',
    )
    expect(screen.queryByTestId('profile-field-name-hint')).toBeNull()
  })

  it('blocks Save while invalid, empty, or saving', () => {
    const { rerender } = setup({
      isEditing: true,
      validate: (draft) => (draft === 'bad' ? 'Not valid' : undefined),
    })
    const save = () =>
      screen.getByTestId<HTMLButtonElement>('profile-field-name-save')

    expect(save().disabled).toBe(false)

    fireEvent.change(screen.getByTestId('profile-field-name-input'), {
      target: { value: 'bad' },
    })
    expect(save().disabled).toBe(true)

    fireEvent.change(screen.getByTestId('profile-field-name-input'), {
      target: { value: '' },
    })
    expect(save().disabled).toBe(true)

    rerender(
      <EditableFieldCard
        fieldKey="name"
        label="Name"
        value="Riya"
        isEditing
        isSaving
        isDimmed={false}
        onEdit={vi.fn()}
        onCancel={vi.fn()}
        onSave={vi.fn()}
      />,
    )
    expect(save().disabled).toBe(true)
    expect(save().textContent).toContain('Saving')
  })

  it('applies the sanitizer to every keystroke', () => {
    setup({
      isEditing: true,
      value: '',
      sanitize: (raw) => raw.replace(/\D/g, '').slice(0, 4),
    })

    const input = screen.getByTestId<HTMLInputElement>(
      'profile-field-name-input',
    )
    fireEvent.change(input, { target: { value: 'ab12-345678' } })
    expect(input.value).toBe('1234')
  })

  it('re-seeds the draft when the saved value changes underneath', () => {
    const { rerender } = setup({ isEditing: true })
    rerender(
      <EditableFieldCard
        fieldKey="name"
        label="Name"
        value="Updated Elsewhere"
        isEditing
        isSaving={false}
        isDimmed={false}
        onEdit={vi.fn()}
        onCancel={vi.fn()}
        onSave={vi.fn()}
      />,
    )
    expect(
      screen.getByTestId<HTMLInputElement>('profile-field-name-input').value,
    ).toBe('Updated Elsewhere')
  })
})
