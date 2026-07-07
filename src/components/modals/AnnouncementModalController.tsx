import { useEffect } from 'react'
import { AnnouncementPopupModal } from './AnnouncementPopupModal'
import { useModals } from './ModalContext'
import { useAnnouncementPopups } from './useAnnouncementPopups'

/**
 * Runs on every authenticated page. Polls for pending announcement popups and,
 * whenever one is queued, registers `'announcement'` with the central modal
 * system and renders it — but only while it's the topmost modal, so a
 * higher-priority modal opened elsewhere suppresses it until that one closes.
 */
export function AnnouncementModalController() {
  const { activeModal, openModal, closeModal } = useModals()
  const { current, isSubmitting, handleMarkRead, handleCta, handleShowLater } = useAnnouncementPopups()

  useEffect(() => {
    if (current) openModal('announcement')
    else closeModal('announcement')
  }, [current, openModal, closeModal])

  return (
    <AnnouncementPopupModal
      open={current !== null && activeModal === 'announcement'}
      item={current}
      isSubmitting={isSubmitting}
      onShowLater={handleShowLater}
      onMarkRead={handleMarkRead}
      onCta={handleCta}
    />
  )
}
