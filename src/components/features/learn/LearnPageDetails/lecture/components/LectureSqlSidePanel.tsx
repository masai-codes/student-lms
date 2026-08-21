'use client'

import { X } from '@phosphor-icons/react'

import { LectureResizableSidePanel } from './LectureResizableSidePanel'
import { useLectureSqlPlaygroundOptional } from '../hooks/LectureSqlPlaygroundContext'
import { SqlPlaygroundContent } from '../sql-playground/SqlPlaygroundContent'

import type {
  InLecturePopupMetaData,
  InLecturePopupSqlSandboxElement,
} from '@/server/learn/lectureDetailTypes'

type LectureSqlSidePanelProps = {
  metaData: InLecturePopupMetaData | null
  sqlSandbox: Array<InLecturePopupSqlSandboxElement>
  onClose: () => void
  /** Target width (px) when open — animates 0 ↔ width. */
  width: number
  /** True while the divider is being dragged (disables the width transition). */
  isDragging: boolean
  /** Reveal state from `useChatPanelReveal` (open vs. closing). */
  isOpen: boolean
  onResizeStart: (event: React.PointerEvent) => void
  onNudge: (deltaPx: number) => void
}

/**
 * The resizable SQL Playground column — shares its shell
 * (`LectureResizableSidePanel`) and width/resize mechanics with
 * `LectureChatSidePanel`, so the two panels behave identically (same resize,
 * same reveal animation, same relationship to the video/fullscreen). Shared
 * by the inline stage and the in-video fullscreen layout, same as the chat.
 */
export function LectureSqlSidePanel({
  metaData,
  sqlSandbox,
  onClose,
  width,
  isDragging,
  isOpen,
  onResizeStart,
  onNudge,
}: LectureSqlSidePanelProps) {
  const sqlPlayground = useLectureSqlPlaygroundOptional()

  if (!metaData?.enableSqlPlayground) return null

  return (
    <LectureResizableSidePanel
      testId="sql-playground-panel"
      width={width}
      isDragging={isDragging}
      isOpen={isOpen}
      onResizeStart={onResizeStart}
      onNudge={onNudge}
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <p className="type-b1-md text-foreground">SQL Playground</p>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-foreground-muted hover:bg-surface-muted hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1">
          <SqlPlaygroundContent
            metaData={metaData}
            sqlSandbox={sqlSandbox}
            highlightedEntryId={sqlPlayground?.highlightedEntryId ?? null}
          />
        </div>
      </div>
    </LectureResizableSidePanel>
  )
}
