import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Editor } from 'codemirror'
import { Loader2, Play } from 'lucide-react'

import { useTheme } from '@/lib/theme'
import type {
  InLecturePopupMetaData,
  InLecturePopupSqlSandboxElement,
} from '@/server/learn/lectureDetailTypes'
import { LectureTabEmptyState } from '../tabs/LectureTabEmptyState'
import { ResultsPanel } from './ResultsPanel'
import { SandboxHistoryPanel } from './SandboxHistoryPanel'
import { SqlCodeMirror } from './SqlCodeMirror'
import { SqlPlaygroundAccordionPanel } from './SqlPlaygroundAccordionPanel'
import { TablesPanel } from './TablesPanel'
import type { EditorEngine, ResultSet, TableSchema } from './types'

const DEFAULT_QUERY = `-- Explore the tables above, then write SQL here.
-- Run with Ctrl/⌘ + Enter, or tap a table name for a quick SELECT.
`

/**
 * The statement containing `offset`, splitting on semicolons while skipping
 * ones inside strings and comments. Falls back to the closest preceding
 * statement when the cursor sits in trailing whitespace (standard SQL editor
 * behavior).
 */
function statementAtOffset(sql: string, offset: number): string {
  const ranges: Array<[number, number]> = []
  let start = 0
  let i = 0
  while (i < sql.length) {
    const ch = sql[i]
    const next = sql[i + 1]
    if (ch === "'" || ch === '"') {
      i++
      while (i < sql.length && sql[i] !== ch) i++
      i++
    } else if (ch === '-' && next === '-') {
      while (i < sql.length && sql[i] !== '\n') i++
    } else if (ch === '/' && next === '*') {
      i += 2
      while (i < sql.length && !(sql[i] === '*' && sql[i + 1] === '/')) i++
      i += 2
    } else if (ch === ';') {
      ranges.push([start, i + 1])
      start = i + 1
      i++
    } else {
      i++
    }
  }
  if (start < sql.length) ranges.push([start, sql.length])

  let containing = ranges.length - 1
  for (let r = 0; r < ranges.length; r++) {
    if (offset >= ranges[r][0] && offset <= ranges[r][1]) {
      containing = r
      break
    }
  }
  for (let r = containing; r >= 0; r--) {
    const stmt = sql.slice(ranges[r][0], ranges[r][1]).trim()
    if (stmt) return stmt
  }
  return ''
}

type SqlPlaygroundContentProps = {
  /**
   * The caller (`LectureSqlSidePanel` / `LectureSqlPlaygroundMobileEntry`)
   * only renders this when `metaData.enableSqlPlayground` is true, so this
   * component itself doesn't re-check that flag — only whether there's an
   * actually-fetchable template.
   */
  metaData: InLecturePopupMetaData
  sqlSandbox: Array<InLecturePopupSqlSandboxElement>
  /** The entry to highlight in "Instructor's queries" (e.g. the one that triggered the nudge). */
  highlightedEntryId?: number | null
}

/**
 * The SQL Playground drawer's body. Always stacked (Tables accordion → editor
 * → results → "Instructor's queries" accordion) — the same layout the tab
 * version used on mobile. The drawer is never wide enough for a side-by-side
 * three-pane layout (it's a bounded rail/sheet, not the whole page), so
 * there's no separate desktop layout to maintain here.
 */
export function SqlPlaygroundContent({
  metaData,
  sqlSandbox,
  highlightedEntryId = null,
}: SqlPlaygroundContentProps) {
  const templateFile = metaData.sqlTemplateFile

  if (!templateFile) {
    return (
      <LectureTabEmptyState
        title="SQL playground not available"
        description="This lecture has no SQL playground template configured — check back once your instructor sets one up."
      />
    )
  }

  if (templateFile.status !== 'UPLOADED') {
    return (
      <LectureTabEmptyState
        title="SQL playground is still being prepared"
        description="The dataset for this playground hasn't finished uploading yet — check back shortly."
      />
    )
  }

  return (
    <SqlPlaygroundEditor
      templateUrl={templateFile.url}
      editorType={metaData.editorType}
      sqlSandbox={sqlSandbox}
      highlightedEntryId={highlightedEntryId}
    />
  )
}

type SqlPlaygroundEditorProps = {
  templateUrl: string
  editorType: 'sqlite' | 'postgres'
  sqlSandbox: Array<InLecturePopupSqlSandboxElement>
  highlightedEntryId: number | null
}

function SqlPlaygroundEditor({
  templateUrl,
  editorType,
  sqlSandbox,
  highlightedEntryId,
}: SqlPlaygroundEditorProps) {
  const { resolvedTheme } = useTheme()
  const [engine, setEngine] = useState<EditorEngine | null>(null)
  const [engineError, setEngineError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [schema, setSchema] = useState<TableSchema[]>([])
  const [query, setQuery] = useState(DEFAULT_QUERY)
  const [results, setResults] = useState<ResultSet[] | null>(null)
  const [queryError, setQueryError] = useState<string | null>(null)
  const [elapsedMs, setElapsedMs] = useState<number | null>(null)

  // Only one of the two accordions is open at a time — there's no room for
  // both alongside the editor in a bounded drawer.
  const [expandedPanel, setExpandedPanel] = useState<
    'tables' | 'history' | null
  >(null)
  const togglePanel = useCallback((panel: 'tables' | 'history') => {
    setExpandedPanel((current) => (current === panel ? null : panel))
  }, [])

  const cmRef = useRef<Editor | null>(null)

  // Lazily import the right engine module so a Postgres lecture never pulls
  // sql.js's wasm into the bundle, and vice versa.
  useEffect(() => {
    let cancelled = false
    setReady(false)
    setEngineError(null)
    setEngine(null)

    const load =
      editorType === 'postgres'
        ? import('./pgliteEngine').then((m) =>
            m.createPgliteEngine(templateUrl),
          )
        : import('./sqljsEngine').then((m) => m.createSqljsEngine(templateUrl))

    load
      .then(async (created) => {
        if (cancelled) return
        await created.init()
        if (cancelled) return
        const tables = await created.schema()
        if (cancelled) return
        setEngine(created)
        setSchema(tables)
        setReady(true)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setEngineError(
            err instanceof Error ? err.message : 'Failed to load the database',
          )
        }
      })

    return () => {
      cancelled = true
    }
  }, [templateUrl, editorType])

  // Landed here via the nudge — auto-expand the history panel so the
  // highlighted query is actually visible instead of hidden behind a chevron.
  useEffect(() => {
    if (highlightedEntryId !== null) setExpandedPanel('history')
  }, [highlightedEntryId])

  const runSql = useCallback(
    async (sql: string) => {
      if (!engine || !ready || !sql.trim()) return
      const start = performance.now()
      try {
        const execResults = await engine.exec(sql)
        setElapsedMs(performance.now() - start)
        setResults(execResults)
        setQueryError(null)
        // DDL/DML may have changed tables or row counts.
        setSchema(await engine.schema())
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        setElapsedMs(null)
        setResults(null)
        setQueryError(message)
      }
    },
    [engine, ready],
  )

  const runAll = useCallback(() => {
    void runSql(query)
  }, [runSql, query])

  /** Run the selection if there is one, otherwise the statement at the cursor. */
  const runSelected = useCallback(() => {
    const cm = cmRef.current
    if (!cm) {
      void runSql(query)
      return
    }
    const selection = cm.getSelection()
    if (selection.trim()) {
      void runSql(selection)
      return
    }
    const doc = cm.getValue()
    void runSql(statementAtOffset(doc, cm.indexFromPos(cm.getCursor())))
  }, [runSql, query])

  const insertTableQuery = (tableName: string) => {
    setQuery(`SELECT * FROM ${tableName} LIMIT 50;`)
    setExpandedPanel(null)
  }

  const sortedSandbox = useMemo(
    () =>
      [...sqlSandbox].sort(
        (a, b) => (a.executedAtSec ?? Infinity) - (b.executedAtSec ?? Infinity),
      ),
    [sqlSandbox],
  )

  return (
    <div
      data-testid="sql-playground-content"
      className="flex h-full flex-col gap-3 overflow-y-auto p-3"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-foreground-muted">
          {editorType === 'postgres' ? 'PostgreSQL' : 'SQLite'} playground
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={runAll}
            disabled={!ready}
            title="Run the entire script"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-surface-muted disabled:opacity-50"
          >
            <Play size={12} />
            Run all
          </button>
          <button
            type="button"
            onClick={runSelected}
            disabled={!ready}
            title="Run the selection, or the statement at the cursor (Ctrl/⌘+Enter)"
            data-testid="sql-playground-run-selected"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Play size={12} />
            Run selected
          </button>
        </div>
      </div>

      {engineError ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
        >
          Failed to initialize database: {engineError}
        </div>
      ) : !ready ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-muted p-4 text-sm text-foreground-muted">
          <Loader2 size={16} className="animate-spin" />
          Loading database…
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <SqlPlaygroundAccordionPanel
            title="Tables"
            count={schema.length}
            expanded={expandedPanel === 'tables'}
            onToggle={() => togglePanel('tables')}
            testId="sql-playground-tables-accordion"
          >
            <TablesPanel schema={schema} onSelectTable={insertTableQuery} />
          </SqlPlaygroundAccordionPanel>

          <div className="h-64 overflow-hidden rounded-lg border border-border">
            <SqlCodeMirror
              value={query}
              onChange={setQuery}
              onRun={runSelected}
              theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
              editorRef={cmRef}
            />
          </div>

          <div className="max-h-72 min-h-[120px] overflow-auto rounded-lg border border-border p-2">
            <ResultsPanel
              results={results}
              error={queryError}
              elapsedMs={elapsedMs}
            />
          </div>

          <SqlPlaygroundAccordionPanel
            title="Instructor’s queries"
            count={sortedSandbox.length}
            expanded={expandedPanel === 'history'}
            onToggle={() => togglePanel('history')}
            testId="sql-playground-history-accordion"
          >
            <SandboxHistoryPanel
              entries={sortedSandbox}
              highlightedEntryId={highlightedEntryId}
            />
          </SqlPlaygroundAccordionPanel>
        </div>
      )}
    </div>
  )
}
