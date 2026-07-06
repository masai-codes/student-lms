// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ModalProvider, useModals } from './ModalContext'

const wrapper = ({ children }: { children: React.ReactNode }) => <ModalProvider>{children}</ModalProvider>

describe('ModalProvider', () => {
  it('has no active modal initially', () => {
    const { result } = renderHook(() => useModals(), { wrapper })
    expect(result.current.activeModal).toBeNull()
    expect(result.current.isModalOpen('announcement')).toBe(false)
  })

  it('opens a modal (it becomes active) and closes it by name', () => {
    const { result } = renderHook(() => useModals(), { wrapper })
    act(() => result.current.openModal('announcement'))
    expect(result.current.activeModal).toBe('announcement')
    expect(result.current.isModalOpen('announcement')).toBe(true)

    act(() => result.current.closeModal('announcement'))
    expect(result.current.activeModal).toBeNull()
  })

  it('closeModal() with no name closes the topmost', () => {
    const { result } = renderHook(() => useModals(), { wrapper })
    act(() => result.current.openModal('announcement'))
    act(() => result.current.closeModal())
    expect(result.current.activeModal).toBeNull()
  })

  it('re-opening an already-open modal is idempotent', () => {
    const { result } = renderHook(() => useModals(), { wrapper })
    act(() => result.current.openModal('announcement'))
    act(() => result.current.openModal('announcement'))
    expect(result.current.activeModal).toBe('announcement')
    act(() => result.current.closeModal('announcement'))
    expect(result.current.isModalOpen('announcement')).toBe(false)
  })
})
