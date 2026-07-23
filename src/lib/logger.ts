export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type LogFields = {
  msg: string
  fn?: string
  requestId?: string
  userId?: string | number
  err?: unknown
} & Record<string, unknown>

function serializeError(err: unknown): unknown {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
    }
  }
  return err
}

function buildPayload(
  level: LogLevel,
  fields: LogFields,
): Record<string, unknown> {
  const { err, ...rest } = fields
  return {
    level,
    time: new Date().toISOString(),
    ...rest,
    ...(err !== undefined ? { err: serializeError(err) } : {}),
  }
}

function formatOutput(payload: Record<string, unknown>): string {
  if (process.env.NODE_ENV === 'production') {
    return JSON.stringify(payload)
  }
  return JSON.stringify(payload, null, 2)
}

function writeLog(level: LogLevel, output: string): void {
  switch (level) {
    case 'error':
      console.error(output)
      break
    case 'warn':
      console.warn(output)
      break
    default:
      console.log(output)
  }
}

/** Structured logger for server-side use. Writes JSON to stdout/stderr for PM2 + CloudWatch. */
export function log(level: LogLevel, fields: LogFields): void {
  writeLog(level, formatOutput(buildPayload(level, fields)))
}

export const logger = {
  debug: (fields: LogFields) => log('debug', fields),
  info: (fields: LogFields) => log('info', fields),
  warn: (fields: LogFields) => log('warn', fields),
  error: (fields: LogFields) => log('error', fields),
} as const
