import { createContext, useCallback, useContext, useMemo, useState } from 'react'

/**
 * Every modal the app can show, by name. Add new modals here — the central
 * `ModalProvider` coordinates which one is visible so overlays never fight.
 */
export type ModalName = 'announcement'

interface ModalContextValue {
  /** The modal currently on top of the stack (the one that should render), or null. */
  activeModal: ModalName | null
  /** Request a modal be shown. If another is already open, this stacks under it. */
  openModal: (name: ModalName) => void
  /** Close a modal (defaults to the topmost). */
  closeModal: (name?: ModalName) => void
  /** Whether a modal is anywhere in the open stack (not necessarily on top). */
  isModalOpen: (name: ModalName) => boolean
}

const ModalContext = createContext<ModalContextValue | null>(null)

/**
 * Central controller for all app modals. Holds a stack of open modals — only the
 * topmost renders, and lower ones resume when it closes — so any component can
 * `openModal(...)` from anywhere without modals overlapping. Mounted once inside
 * the authenticated layout.
 */
export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [stack, setStack] = useState<Array<ModalName>>([])

  const openModal = useCallback((name: ModalName) => {
    // Move to the top (dedupe) so re-opening an already-stacked modal surfaces it.
    setStack((prev) => (prev[prev.length - 1] === name ? prev : [...prev.filter((n) => n !== name), name]))
  }, [])

  const closeModal = useCallback((name?: ModalName) => {
    setStack((prev) => (name ? prev.filter((n) => n !== name) : prev.slice(0, -1)))
  }, [])

  const value = useMemo<ModalContextValue>(
    () => ({
      activeModal: stack[stack.length - 1] ?? null,
      openModal,
      closeModal,
      isModalOpen: (name) => stack.includes(name),
    }),
    [stack, openModal, closeModal],
  )

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>
}

export function useModals(): ModalContextValue {
  const ctx = useContext(ModalContext)
  if (!ctx) throw new Error('useModals must be used within a ModalProvider')
  return ctx
}
