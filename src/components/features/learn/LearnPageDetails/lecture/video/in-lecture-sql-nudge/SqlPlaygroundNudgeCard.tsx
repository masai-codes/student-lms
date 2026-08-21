'use client'

import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'

type SqlPlaygroundNudgeCardProps = {
  /**
   * The video's own root element — portaling here (rather than rendering as
   * a plain JSX child inside `.react-player-page`) keeps the card off that
   * div's global `> div { width/height: 100% !important }` rule (meant for
   * the player + full-bleed overlays), which would otherwise stretch this
   * small card to fill the whole video canvas. `null` until the ref is
   * attached (first render) — nothing renders until then.
   */
  portalContainer: HTMLElement | null
  onOpen: () => void
  onDismiss: () => void
}

/**
 * Small dismissible card nudging the viewer toward the SQL Playground as
 * playback crosses a moment the instructor ran a query live. Portaled into
 * the video's own root (`position: relative`, and itself the fullscreen root
 * while fullscreen), positioned `absolute top-4 right-4` — the video
 * canvas's top-right corner, fullscreen or not. Auto-dismiss timing lives
 * in `useInLectureSqlNudge`.
 */
export function SqlPlaygroundNudgeCard({
  portalContainer,
  onOpen,
  onDismiss,
}: SqlPlaygroundNudgeCardProps) {
  if (!portalContainer) return null

  return createPortal(
    <div
      data-testid="sql-playground-nudge-card"
      role="status"
      className="animate-in fade-in-0 slide-in-from-top-2 absolute top-4 right-4 z-[200] w-72 max-w-[calc(100%-2rem)] rounded-lg border border-border bg-surface p-3 shadow-2xl"
    >
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        data-testid="sql-playground-nudge-dismiss"
        className="absolute right-2 top-2 flex size-5 items-center justify-center rounded text-foreground-muted hover:bg-surface-muted hover:text-foreground"
      >
        <X size={13} />
      </button>
      <p className="pr-5 text-sm font-medium text-foreground">
        Your instructor ran a SQL query here
      </p>
      <p className="mt-0.5 text-xs text-foreground-muted">
        Open the SQL Playground to try it yourself.
      </p>
      <Button
        type="button"
        size="sm"
        className="mt-2"
        data-testid="sql-playground-nudge-open"
        onClick={onOpen}
      >
        Open SQL Playground
      </Button>
    </div>,
    portalContainer,
  )
}
