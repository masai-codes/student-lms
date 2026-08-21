import type { ResultSet } from './types'

type ResultsPanelProps = {
  results: ResultSet[] | null
  error: string | null
  elapsedMs: number | null
}

export function ResultsPanel({ results, error, elapsedMs }: ResultsPanelProps) {
  if (error) {
    return (
      <div
        data-testid="sql-playground-results"
        className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        role="alert"
      >
        {error}
      </div>
    )
  }

  if (results === null) {
    return (
      <div
        data-testid="sql-playground-results"
        className="flex h-full items-center justify-center rounded-lg border border-dashed border-border p-6 text-center text-sm text-foreground-muted"
      >
        Run a query to see results —{' '}
        <kbd className="mx-1 rounded border border-border px-1">Ctrl</kbd>/
        <kbd className="mx-1 rounded border border-border px-1">⌘</kbd> +{' '}
        <kbd className="mx-1 rounded border border-border px-1">Enter</kbd>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div
        data-testid="sql-playground-results"
        className="flex h-full items-center justify-center rounded-lg border border-border bg-surface-muted p-6 text-center text-sm text-foreground-muted"
      >
        Statement executed successfully — no rows returned
        {elapsedMs !== null && ` (${elapsedMs.toFixed(1)} ms)`}
      </div>
    )
  }

  return (
    <div data-testid="sql-playground-results" className="flex flex-col gap-3">
      {results.map((result, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-lg border border-border"
        >
          <div className="border-b border-border bg-surface-muted px-3 py-1.5 text-xs text-foreground-muted">
            {result.values.length} row{result.values.length === 1 ? '' : 's'}
            {elapsedMs !== null && i === 0 && ` • ${elapsedMs.toFixed(1)} ms`}
          </div>
          <div className="max-h-80 overflow-auto">
            <table className="w-full min-w-max border-collapse text-left text-sm">
              <thead>
                <tr className="bg-surface-muted">
                  <th className="sticky top-0 border-b border-border bg-surface-muted px-2 py-1.5 text-xs font-medium text-foreground-muted">
                    #
                  </th>
                  {result.columns.map((col) => (
                    <th
                      key={col}
                      className="sticky top-0 whitespace-nowrap border-b border-border bg-surface-muted px-3 py-1.5 text-xs font-medium text-foreground"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.values.map((row, rowIdx) => (
                  <tr
                    key={rowIdx}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-2 py-1.5 text-xs text-foreground-muted">
                      {rowIdx + 1}
                    </td>
                    {row.map((cell, cellIdx) => (
                      <td
                        key={cellIdx}
                        className={
                          cell === null
                            ? 'whitespace-nowrap px-3 py-1.5 text-foreground-muted italic'
                            : 'whitespace-nowrap px-3 py-1.5 text-foreground'
                        }
                      >
                        {cell === null ? 'NULL' : String(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
