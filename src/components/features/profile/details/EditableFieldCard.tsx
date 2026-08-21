import { useEffect, useRef, useState } from 'react'
import { MasaiButton } from '@/components/ui/masai-button'
import { MasaiInput } from '@/components/ui/masai-input'
import { pushProfileEvent } from '@/components/features/profile/shared/profileAnalytics'

export interface EditableFieldCardProps {
  /** Used for testids and analytics, e.g. `name`. */
  fieldKey: string
  label: string
  value: string
  placeholder?: string
  /** Hint shown while editing — the constraint, before the user trips it. */
  hint?: (draft: string) => string | undefined
  /** Validation message, or undefined when the draft is acceptable. */
  validate?: (draft: string) => string | undefined
  /** Normalises keystrokes (e.g. digits only). */
  sanitize?: (raw: string) => string
  isEditing: boolean
  isSaving: boolean
  /** Another card is open — this one is inert until that one closes. */
  isDimmed: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: (nextValue: string) => void
}

/**
 * One inline-editable profile field.
 *
 * Only one card in the grid edits at a time (matching the old page), but the
 * inactive cards are genuinely inert — `disabled` + `aria-disabled` rather than
 * the old 45%-opacity overlay that still accepted clicks.
 */
export function EditableFieldCard({
  fieldKey,
  label,
  value,
  placeholder,
  hint,
  validate,
  sanitize,
  isEditing,
  isSaving,
  isDimmed,
  onEdit,
  onCancel,
  onSave,
}: EditableFieldCardProps) {
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  // Re-seed the draft whenever editing opens or the saved value changes.
  useEffect(() => {
    if (isEditing) {
      setDraft(value)
      inputRef.current?.focus()
    }
  }, [isEditing, value])

  const error = isEditing ? validate?.(draft) : undefined
  const hintText = isEditing ? hint?.(draft) : undefined
  const canSave = !error && !isSaving && draft !== ''

  return (
    <div
      data-testid={`profile-field-${fieldKey}`}
      aria-disabled={isDimmed || undefined}
      className={`flex flex-col rounded-2xl border bg-surface p-4 transition-opacity ${
        isEditing ? 'border-brand' : 'border-border'
      } ${isDimmed ? 'pointer-events-none opacity-50' : ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="type-b2-md text-foreground-muted">{label}</p>
        {!isEditing ? (
          <MasaiButton
            type="link"
            size="sm"
            ctaText="Edit"
            data-testid={`profile-field-${fieldKey}-edit`}
            disabled={isDimmed}
            onClick={() => {
              pushProfileEvent('field_edit_open', { field: fieldKey })
              onEdit()
            }}
          />
        ) : null}
      </div>

      {isEditing ? (
        <div className="mt-2 flex flex-col gap-2">
          <MasaiInput
            ref={inputRef}
            value={draft}
            placeholder={placeholder}
            aria-label={label}
            aria-invalid={Boolean(error)}
            data-testid={`profile-field-${fieldKey}-input`}
            onChange={(event) =>
              setDraft(
                sanitize ? sanitize(event.target.value) : event.target.value,
              )
            }
          />
          {error ? (
            <p
              role="alert"
              data-testid={`profile-field-${fieldKey}-error`}
              className="type-caption text-danger"
            >
              {error}
            </p>
          ) : hintText ? (
            <p
              data-testid={`profile-field-${fieldKey}-hint`}
              className="type-caption text-foreground-subtle"
            >
              {hintText}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <MasaiButton
              type="secondary"
              size="sm"
              ctaText="Cancel"
              data-testid={`profile-field-${fieldKey}-cancel`}
              onClick={onCancel}
            />
            <MasaiButton
              size="sm"
              ctaText={isSaving ? 'Saving…' : 'Save'}
              disabled={!canSave}
              data-testid={`profile-field-${fieldKey}-save`}
              onClick={() => {
                pushProfileEvent('field_save', { field: fieldKey })
                onSave(draft)
              }}
            />
          </div>
        </div>
      ) : (
        <p
          data-testid={`profile-field-${fieldKey}-value`}
          className="mt-2 break-words type-b1-regular text-foreground"
        >
          {value || <span className="text-foreground-subtle">Not set</span>}
        </p>
      )}
    </div>
  )
}
