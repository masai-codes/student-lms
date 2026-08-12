import { createFileRoute } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/(protected)/_layout/theme-lab')({
  component: ThemeLabRoute,
})

/**
 * Theme Lab — a kitchen-sink of every semantic token and core component,
 * rendered purely against theme tokens. Switch themes from the navbar toggle
 * (or the inline picker) and everything here should re-theme with guaranteed
 * contrast. This is the visual QA surface for the theming system.
 */
function ThemeLabRoute() {
  const { preference, resolvedTheme, setPreference, hydrated } = useTheme()

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Theme Lab</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Active theme:{' '}
          <span className="font-semibold text-brand">
            {hydrated ? resolvedTheme : 'light'}
          </span>{' '}
          (preference: {hydrated ? preference : 'system'}). Every surface below
          is driven only by semantic tokens.
        </p>
      </header>

      {/* Inline preference picker */}
      <section className="mb-10">
        <SectionTitle>Theme preference</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {(['light', 'dark', 'system'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPreference(p)}
              className={cn(
                'flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm capitalize transition-colors',
                hydrated && p === preference
                  ? 'border-brand bg-brand-subtle text-brand-subtle-foreground'
                  : 'border-border bg-surface text-foreground-muted hover:border-border-strong',
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </section>

      {/* Token pairs */}
      <section className="mb-10">
        <SectionTitle>Semantic surfaces & pairs</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <Pair className="bg-background text-foreground border border-border">
            background / foreground
          </Pair>
          <Pair className="bg-surface text-surface-foreground border border-border">
            surface
          </Pair>
          <Pair className="bg-surface-muted text-surface-muted-foreground">
            surface-muted
          </Pair>
          <Pair className="bg-muted text-muted-foreground">muted</Pair>
          <Pair className="bg-primary text-primary-foreground">primary</Pair>
          <Pair className="bg-brand text-brand-foreground">brand</Pair>
          <Pair className="bg-brand-subtle text-brand-subtle-foreground">
            brand-subtle
          </Pair>
          <Pair className="bg-accent-warm text-accent-warm-foreground">
            accent-warm
          </Pair>
          <Pair className="bg-accent text-accent-foreground">accent</Pair>
          <Pair className="bg-secondary text-secondary-foreground">
            secondary
          </Pair>
        </div>
      </section>

      {/* Status */}
      <section className="mb-10">
        <SectionTitle>Status colors</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* Literal class strings — Tailwind only generates utilities it can
              see verbatim in source, so we can't build these dynamically. */}
          {(
            [
              {
                label: 'Success',
                solid: 'bg-success text-success-foreground',
                subtle: 'bg-success-subtle text-success-subtle-foreground',
              },
              {
                label: 'Warning',
                solid: 'bg-warning text-warning-foreground',
                subtle: 'bg-warning-subtle text-warning-subtle-foreground',
              },
              {
                label: 'Danger',
                solid: 'bg-danger text-danger-foreground',
                subtle: 'bg-danger-subtle text-danger-subtle-foreground',
              },
              {
                label: 'Info',
                solid: 'bg-info text-info-foreground',
                subtle: 'bg-info-subtle text-info-subtle-foreground',
              },
            ] as const
          ).map((s) => (
            <div key={s.label} className="space-y-2">
              <div
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-medium',
                  s.solid,
                )}
              >
                {s.label} solid
              </div>
              <div
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-medium',
                  s.subtle,
                )}
              >
                {s.label} subtle
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Components */}
      <section className="mb-10">
        <SectionTitle>Components</SectionTitle>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge>Badge</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>

          <div className="max-w-sm space-y-2">
            <label className="text-sm font-medium text-foreground">Input</label>
            <Input placeholder="Type something delightful…" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Card title</CardTitle>
                <CardDescription>
                  Cards use surface + border tokens, so they re-theme cleanly.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground-muted">
                  Body text uses <code>text-foreground-muted</code>. Links and
                  accents use <span className="text-brand">brand</span>.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border-strong">
              <CardHeader>
                <CardTitle>Contrast is guaranteed</CardTitle>
                <CardDescription>
                  Every fg/bg pair passes WCAG AA in every theme (checked in
                  CI).
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <span className="rounded-md bg-success-subtle px-2 py-1 text-xs font-medium text-success-subtle-foreground">
                  Enrolled
                </span>
                <span className="rounded-md bg-warning-subtle px-2 py-1 text-xs font-medium text-warning-subtle-foreground">
                  Pending
                </span>
                <span className="rounded-md bg-danger-subtle px-2 py-1 text-xs font-medium text-danger-subtle-foreground">
                  Overdue
                </span>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
      {children}
    </h2>
  )
}

function Pair({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'flex h-20 items-end rounded-lg p-3 text-xs font-medium',
        className,
      )}
    >
      {children}
    </div>
  )
}
