import { Link, useRouter } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Global error boundary UI, wired as the router's `defaultErrorComponent`.
 *
 * Router's built-in `ErrorComponent` renders `error.message` and a stack trace
 * straight onto the page, so an infra failure (DB down, pool exhausted) would
 * show students raw MySQL text. This replaces it with a single generic message:
 * the real error is logged to the console for ops, and the details block only
 * exists in dev (`import.meta.env.DEV` is statically replaced, so the branch is
 * dropped from the production bundle entirely).
 */
export default function AppError({ error, reset }: ErrorComponentProps) {
  const router = useRouter()

  // Server-side always (PM2/CloudWatch need the real cause); in the browser only
  // in dev, so a production console doesn't echo DB/schema internals back at the
  // student. `import.meta.env.DEV` is statically replaced, so the dev branch is
  // dropped from the production bundle.
  if (import.meta.env.DEV || typeof window === 'undefined') {
    console.error('[app] route error:', error)
  }

  const handleRetry = () => {
    // Re-run the failed loaders, then clear the boundary so the route remounts.
    void router.invalidate()
    reset()
  }

  return (
    <div
      className="flex min-h-[40vh] items-center justify-center p-4"
      data-testid="app-error"
    >
      <div
        className={cn(
          'flex flex-col items-center gap-4 rounded-lg border bg-surface px-6 py-8 text-center shadow-sm',
          import.meta.env.DEV ? 'max-w-6xl' : 'max-w-md',
        )}
      >
        <AlertTriangle className="size-8 text-destructive" />
        <div className="flex flex-col gap-1">
          <p className="text-base font-medium">Something went wrong</p>
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t load this page. Please try again in a moment.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleRetry} data-testid="app-error-retry">
            Try again
          </Button>
          <Link to="/">
            <Button variant="outline" data-testid="app-error-home">
              Go to home
            </Button>
          </Link>
        </div>
        {import.meta.env.DEV ? (
          <details
            open
            className="w-full text-left"
            data-testid="app-error-details"
          >
            <summary className="cursor-pointer text-xs text-muted-foreground">
              Error details <b>(dev only)</b>
            </summary>
            <pre className="mt-2 max-h-64 overflow-auto rounded bg-muted p-2 text-xs whitespace-pre-wrap">
              {error instanceof Error
                ? (error.stack ?? error.message)
                : String(error)}
            </pre>
          </details>
        ) : null}
      </div>
    </div>
  )
}
