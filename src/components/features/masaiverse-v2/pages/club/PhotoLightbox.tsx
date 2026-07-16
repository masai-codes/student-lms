import { useEffect, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import {
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  X,
} from '@phosphor-icons/react'

type PhotoLightboxProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Image URL to display; null renders nothing. */
  src: string | null
}

const MIN_SCALE = 1
const MAX_SCALE = 4
const STEP = 0.5

const clamp = (value: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, value))

/**
 * Fullscreen image viewer with zoom (buttons + scroll wheel) and drag-to-pan
 * once zoomed. Built on Radix Dialog for focus trapping, Esc-to-close and
 * body-scroll locking. Zoom/pan reset whenever the image or open state changes.
 */
export default function PhotoLightbox({
  open,
  onOpenChange,
  src,
}: PhotoLightboxProps) {
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const drag = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }, [src, open])

  const zoomTo = (next: number) => {
    const clamped = clamp(next)
    setScale(clamped)
    if (clamped === 1) setOffset({ x: 0, y: 0 })
  }

  const onPointerDown = (event: React.PointerEvent) => {
    if (scale <= 1) return
    drag.current = { x: event.clientX - offset.x, y: event.clientY - offset.y }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: React.PointerEvent) => {
    if (!drag.current) return
    setOffset({
      x: event.clientX - drag.current.x,
      y: event.clientY - drag.current.y,
    })
  }

  if (!src) return null

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[400] bg-black/90" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-[400] flex items-center justify-center outline-none"
        >
          <Dialog.Title className="sr-only">Photo viewer</Dialog.Title>

          <div
            className="flex size-full items-center justify-center overflow-hidden"
            onWheel={(event) =>
              zoomTo(scale + (event.deltaY < 0 ? STEP : -STEP))
            }
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={() => (drag.current = null)}
          >
            <img
              src={src}
              alt=""
              draggable={false}
              className="max-h-[90vh] max-w-[92vw] select-none object-contain transition-transform duration-150"
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                cursor: scale > 1 ? 'grab' : 'default',
              }}
            />
          </div>

          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-surface/10 px-2 py-1.5 backdrop-blur">
            <button
              type="button"
              aria-label="Zoom out"
              onClick={() => zoomTo(scale - STEP)}
              disabled={scale <= MIN_SCALE}
              className="flex size-9 items-center justify-center rounded-full text-white hover:bg-surface/15 disabled:opacity-40"
            >
              <MagnifyingGlassMinus size={20} />
            </button>
            <span className="min-w-12 text-center text-[13px] font-medium text-white">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              aria-label="Zoom in"
              onClick={() => zoomTo(scale + STEP)}
              disabled={scale >= MAX_SCALE}
              className="flex size-9 items-center justify-center rounded-full text-white hover:bg-surface/15 disabled:opacity-40"
            >
              <MagnifyingGlassPlus size={20} />
            </button>
          </div>

          <Dialog.Close
            aria-label="Close"
            className="absolute right-5 top-5 flex size-10 items-center justify-center rounded-full bg-surface/10 text-white hover:bg-surface/20"
          >
            <X size={22} />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
