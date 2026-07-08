import { Modal, ModalContent, ModalTitle } from '@/components/ui/modal'
import { MarkdownContent } from '@/components/shared/markdown-content/MarkdownContent'
import type { PopupItem } from '@/server/api/announcement/getAnnouncementPopups.service'

interface AnnouncementPopupModalProps {
  open: boolean
  item: PopupItem | null
  isSubmitting: boolean
  /** "Show me later" / backdrop / escape — close without marking read. */
  onShowLater: () => void
  /** "Mark as read" — always shown; marks the popup read. */
  onMarkRead: () => void
  /** Link CTA — mark read + close, then open the link. */
  onCta: () => void
}

/**
 * Announcement popup. There's no close (X) — instead a "Show me later" action
 * sits where the close icon would be, and backdrop / escape behave the same:
 * they dismiss without marking read. "Mark as read" is always present so the
 * popup can always be cleared; when the announcement has a link CTA, that CTA
 * is shown as well and also marks the popup read.
 */
export function AnnouncementPopupModal({
  open,
  item,
  isSubmitting,
  onShowLater,
  onMarkRead,
  onCta,
}: AnnouncementPopupModalProps) {
  const hasCta = Boolean(item?.ctaName?.trim() && item?.ctaLink?.trim())

  return (
    <Modal
      open={open && item !== null}
      onOpenChange={(next) => {
        // Backdrop click / escape → same as "Show me later".
        if (!next) onShowLater()
      }}
    >
      <ModalContent
        showCloseButton={false}
        data-testid="announcement-popup-modal"
        className="flex max-h-[85vh] flex-col overflow-hidden p-0"
      >
        {item ? (
          <>
            <div className="flex shrink-0 items-start justify-between gap-3 px-6 pt-6 pb-3">
              <ModalTitle
                data-testid="announcement-popup-title"
                className="pr-1 text-lg font-bold leading-snug text-gray-900"
              >
                {item.title}
              </ModalTitle>
              <button
                type="button"
                onClick={onShowLater}
                data-testid="announcement-popup-show-later"
                className="shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6962AC]"
              >
                Show me later
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4 text-sm leading-relaxed text-gray-600">
              <MarkdownContent value={item.body} />
            </div>

            <div className="flex shrink-0 flex-col gap-2 border-t border-gray-100 px-6 py-4">
              {hasCta ? (
                <button
                  type="button"
                  onClick={onCta}
                  disabled={isSubmitting}
                  data-testid="announcement-popup-cta"
                  className="flex w-full items-center justify-center rounded-xl bg-[#6962AC] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#554f8b] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {item.ctaName}
                </button>
              ) : null}
              <button
                type="button"
                onClick={onMarkRead}
                disabled={isSubmitting}
                data-testid="announcement-popup-mark-read"
                className="flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Mark as read
              </button>
            </div>
          </>
        ) : null}
      </ModalContent>
    </Modal>
  )
}
