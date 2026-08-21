import { useEffect, useRef, useState } from 'react'
import { Check, ClipboardCopy } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { InLecturePopupSqlSandboxElement } from '@/server/learn/lectureDetailTypes'

type SandboxHistoryPanelProps = {
  entries: Array<InLecturePopupSqlSandboxElement>
  /** The entry the SQL playground nudge pointed at — outlined, not scrolled to. */
  highlightedEntryId?: number | null
}

function formatTimestamp(sec: number | null): string | null {
  if (sec === null || sec < 0) return null
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Read-only replay of the instructor's playground runs during the live
 * session — sourced from `zef_lms_sql_sandbox` via `inLecturePopupElements`,
 * not a live feed. Copy only puts the statement on the clipboard — it never
 * touches the student's own editor above.
 */
export function SandboxHistoryPanel({
  entries,
  highlightedEntryId = null,
}: SandboxHistoryPanelProps) {
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current)
    }
  }, [])

  const copy = (entry: InLecturePopupSqlSandboxElement) => {
    void navigator.clipboard
      ?.writeText(entry.query)
      .then(() => {
        setCopiedId(entry.id)
        if (copiedTimer.current) clearTimeout(copiedTimer.current)
        copiedTimer.current = setTimeout(() => setCopiedId(null), 1500)
      })
      .catch(() => {
        // Clipboard denied (insecure context / permissions): the query is still selectable below.
      })
  }

  return (
    <div data-testid="sql-playground-history" className="flex h-full flex-col">
      <div className="shrink-0 border-b border-border px-3 py-2">
        <p className="text-sm font-medium text-foreground">
          Instructor’s queries
        </p>
        <p className="text-xs text-foreground-muted">
          Ran during the live session · view only
        </p>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {entries.length === 0 ? (
          <p className="p-2 text-xs text-foreground-muted">
            Nothing here — no queries were run in this session.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {entries.map((entry) => {
              const timestamp = formatTimestamp(entry.executedAtSec)
              const isHighlighted = entry.id === highlightedEntryId
              return (
                <li
                  key={entry.id}
                  data-testid="sql-playground-history-item"
                  data-highlighted={isHighlighted || undefined}
                  className={cn(
                    'rounded-lg border border-border bg-surface-muted p-2 transition-colors',
                    isHighlighted &&
                      'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2 ring-offset-background',
                  )}
                >
                  <div className="mb-1 flex items-center gap-2">
                    {entry.status === 'error' ? (
                      <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                        Error
                      </span>
                    ) : null}
                    {timestamp ? (
                      <span className="text-[10px] text-foreground-muted">
                        at {timestamp}
                      </span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => copy(entry)}
                      title="Copy this query to the clipboard"
                      className="ml-auto flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-foreground-muted hover:bg-surface hover:text-foreground"
                    >
                      {copiedId === entry.id ? (
                        <Check size={11} />
                      ) : (
                        <ClipboardCopy size={11} />
                      )}
                      {copiedId === entry.id ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs text-foreground">
                    {entry.query}
                  </pre>
                  {entry.status === 'error' && entry.error ? (
                    <p className="mt-1 text-xs text-destructive">
                      {entry.error}
                    </p>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
