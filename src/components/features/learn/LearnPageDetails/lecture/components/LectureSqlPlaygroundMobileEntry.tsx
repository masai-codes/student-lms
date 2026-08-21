'use client'

import { Drawer } from 'vaul'
import { X } from '@phosphor-icons/react'

import { useLectureRailViewport } from '../hooks/useLectureRailViewport'
import { useLectureSqlPlaygroundOptional } from '../hooks/LectureSqlPlaygroundContext'
import { SqlPlaygroundContent } from '../sql-playground/SqlPlaygroundContent'

import type {
  InLecturePopupMetaData,
  InLecturePopupSqlSandboxElement,
} from '@/server/learn/lectureDetailTypes'

type LectureSqlPlaygroundMobileEntryProps = {
  metaData: InLecturePopupMetaData | null
  sqlSandbox: Array<InLecturePopupSqlSandboxElement>
}

/**
 * Mobile + tablet SQL Playground surface — a `vaul` bottom drawer, mirroring
 * `LectureAiChatMobileEntry`. No always-visible launcher row (unlike the AI
 * chat's composer dock): it's opened only by the video toolbar's "SQL" pill
 * or the in-lecture nudge card, both via the shared `LectureSqlPlaygroundContext`
 * `open()`. On laptop/desktop the same context drives the resizable rail
 * instead (`LectureSplitLayout`) — only one surface is ever mounted.
 */
export function LectureSqlPlaygroundMobileEntry({
  metaData,
  sqlSandbox,
}: LectureSqlPlaygroundMobileEntryProps) {
  const sqlPlayground = useLectureSqlPlaygroundOptional()
  const isRail = useLectureRailViewport()

  if (!sqlPlayground || isRail || !metaData?.enableSqlPlayground) return null

  return (
    <Drawer.Root
      open={sqlPlayground.isOpen}
      onOpenChange={(open) =>
        open ? sqlPlayground.open() : sqlPlayground.close()
      }
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[215] bg-black/50" />
        <Drawer.Content
          data-testid="sql-playground-drawer"
          className="fixed inset-x-0 bottom-0 z-[220] flex h-[90dvh] flex-col rounded-t-2xl border-t border-border bg-background outline-none"
        >
          <div className="flex shrink-0 cursor-grab justify-center pt-2.5 active:cursor-grabbing">
            <Drawer.Handle className="!h-1 !w-10 !bg-border" />
          </div>
          <Drawer.Title className="sr-only">SQL Playground</Drawer.Title>
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
            <p className="type-b1-md text-foreground">SQL Playground</p>
            <button
              type="button"
              aria-label="Close"
              onClick={sqlPlayground.close}
              className="flex h-8 w-8 items-center justify-center rounded-full text-foreground-muted hover:bg-surface-muted hover:text-foreground"
            >
              <X size={18} />
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <SqlPlaygroundContent
              metaData={metaData}
              sqlSandbox={sqlSandbox}
              highlightedEntryId={sqlPlayground.highlightedEntryId}
            />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
