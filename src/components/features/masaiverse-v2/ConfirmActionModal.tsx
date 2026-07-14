import { useEffect, useState } from 'react'
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalTitle,
} from '@/components/ui/modal'
import {
  RichContent,
  toRichPreviewText,
} from '@/components/event-card/rich-content'

type ConfirmActionModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Markdown/HTML body, rendered with the shared `RichContent` renderer. */
  confirmationText: string
  /** Heading shown above the body. */
  title?: string
  /** Sentence next to the must-tick checkbox. */
  checkboxLabel?: string
  /** Label of the confirm button (e.g. "Register", "Join club"). */
  confirmLabel: string
  /** Keeps the confirm action disabled while the underlying request is in flight. */
  isPending?: boolean
  onConfirm: () => void
}

/**
 * A reusable "are you sure?" dialog for actions gated behind a configurable,
 * markdown-rendered notice (e.g. event registration, club join). The confirm
 * button stays disabled until the user ticks the acknowledgement checkbox; the
 * tick is intentionally not persisted anywhere.
 */
export default function ConfirmActionModal({
  open,
  onOpenChange,
  confirmationText,
  title = 'Please confirm',
  checkboxLabel = 'I have read the above and want to continue.',
  confirmLabel,
  isPending = false,
  onConfirm,
}: ConfirmActionModalProps) {
  const [acknowledged, setAcknowledged] = useState(false)

  // Start each open with the checkbox cleared so a prior session's tick never
  // carries over into the next confirmation.
  useEffect(() => {
    if (open) setAcknowledged(false)
  }, [open])

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-[480px]">
        <ModalTitle className="pr-8 text-[18px] font-bold text-foreground">
          {title}
        </ModalTitle>

        {/* The plain-text notice registers as the dialog's accessible
            description (silencing Radix's warning and giving screen readers the
            content); the visible markdown is rendered below. */}
        <ModalDescription className="sr-only">
          {toRichPreviewText(confirmationText)}
        </ModalDescription>
        <RichContent
          value={confirmationText}
          className="mt-3 text-[14px] leading-6 text-foreground-muted"
        />

        <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-[14px] leading-5 text-foreground">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-accent-warm"
          />
          <span>{checkboxLabel}</span>
        </label>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-[12px] border border-border px-5 py-2.5 text-[14px] font-semibold text-foreground transition-colors hover:bg-surface-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!acknowledged || isPending}
            className="rounded-[12px] bg-gradient-to-r from-masaiverse-orange to-[#FF7A29] px-5 py-2.5 text-[14px] font-bold text-accent-warm-foreground shadow-[0_8px_20px_-6px_rgba(242,92,4,0.5)] transition-all hover:shadow-[0_10px_26px_-6px_rgba(242,92,4,0.6)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            {confirmLabel}
          </button>
        </div>
      </ModalContent>
    </Modal>
  )
}
