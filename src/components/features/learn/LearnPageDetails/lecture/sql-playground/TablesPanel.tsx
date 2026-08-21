import { useState } from 'react'
import { ChevronRight, Key, Table2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { TableSchema } from './types'

type TablesPanelProps = {
  schema: TableSchema[]
  onSelectTable: (tableName: string) => void
}

export function TablesPanel({ schema, onSelectTable }: TablesPanelProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const toggle = (name: string) => {
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }))
  }

  if (schema.length === 0) {
    return (
      <p
        data-testid="sql-playground-tables-panel"
        className="p-3 text-sm text-foreground-muted"
      >
        No tables in this database.
      </p>
    )
  }

  return (
    <div
      data-testid="sql-playground-tables-panel"
      className="flex flex-col gap-0.5 p-1.5"
    >
      {schema.map((table) => (
        <div key={table.name} data-testid="sql-playground-table-item">
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => toggle(table.name)}
              aria-label={`Toggle columns of ${table.name}`}
              className="flex size-6 shrink-0 items-center justify-center rounded text-foreground-muted hover:bg-surface-muted"
            >
              <ChevronRight
                size={14}
                className={cn(
                  'transition-transform',
                  expanded[table.name] && 'rotate-90',
                )}
              />
            </button>
            <button
              type="button"
              onClick={() => onSelectTable(table.name)}
              title={`Insert SELECT * FROM ${table.name}`}
              className="flex min-w-0 flex-1 items-center gap-1.5 rounded px-1.5 py-1 text-left text-sm text-foreground hover:bg-surface-muted"
            >
              <Table2 size={13} className="shrink-0 text-foreground-muted" />
              <span className="truncate">{table.name}</span>
              <span className="ml-auto shrink-0 text-xs text-foreground-muted">
                {table.rowCount}
              </span>
            </button>
          </div>
          {expanded[table.name] ? (
            <ul className="ml-6 flex flex-col gap-0.5 border-l border-border pb-1 pl-2">
              {table.columns.map((col) => (
                <li
                  key={col.name}
                  className="flex items-center gap-1.5 py-0.5 text-xs"
                >
                  {col.isPrimaryKey ? (
                    <Key size={10} className="shrink-0 text-primary" />
                  ) : (
                    <span className="size-1 shrink-0 rounded-full bg-foreground-muted/50" />
                  )}
                  <span className="truncate text-foreground">{col.name}</span>
                  <span className="ml-auto shrink-0 text-foreground-muted">
                    {col.type.toLowerCase()}
                    {col.notNull ? ' • nn' : ''}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </div>
  )
}
