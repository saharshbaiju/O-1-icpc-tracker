import { useState, type ReactNode } from 'react'
import { Check, Circle, CircleDashed, Code2, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import type { Difficulty, Status, Verdict } from '@/lib/api'
import { initials, VERDICT_SHORT } from '@/lib/format'
import { cn } from '@/lib/utils'

/* Small shared pieces used across the app pages. */

export function Initials({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border bg-secondary text-[11px] font-medium',
        className
      )}
    >
      {initials(name)}
    </span>
  )
}

export function DifficultyBadge({ difficulty: d }: { difficulty: Difficulty | null }) {
  if (!d) return <span className="text-xs text-muted-foreground">—</span>
  return <Badge variant={d === 'Easy' ? 'easy' : d === 'Medium' ? 'medium' : 'hard'}>{d}</Badge>
}

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  return verdict === 'OK' ? (
    <Badge variant="default">
      <Check className="h-3 w-3" /> {VERDICT_SHORT[verdict]}
    </Badge>
  ) : (
    <Badge variant="outline" className="text-muted-foreground">
      <X className="h-3 w-3" /> {VERDICT_SHORT[verdict]}
    </Badge>
  )
}

export function StatusIcon({ status }: { status: Status }) {
  if (status === 'solved')
    return (
      <span title="Solved" role="img" aria-label="Solved" className="grid h-5 w-5 place-items-center rounded-full bg-foreground text-background">
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
    )
  if (status === 'attempted')
    return <CircleDashed aria-label="Attempted" className="h-5 w-5 text-muted-foreground" />
  return <Circle aria-label="Not attempted" className="h-5 w-5 text-border" />
}

/** Label + big number tile used in the stat rows. */
export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="bg-card px-5 py-4">
      <p className="paper-label text-muted-foreground">{label}</p>
      <p className="font-display mt-3 text-3xl tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function StatRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('grid gap-px overflow-hidden rounded-xl border border-border bg-border', className)}>
      {children}
    </div>
  )
}

/**
 * "SQL" toggle: shows the query that produces what is on screen. Handy in a
 * DBMS demo — every number on the page can be traced to a statement.
 */
export function SqlPeek({ sql, label = 'SQL' }: { sql: string; label?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-[11px] font-medium transition-colors hover:bg-secondary"
      >
        <Code2 className="h-3.5 w-3.5" /> {open ? `Hide ${label}` : label}
      </button>
      {open && (
        <pre className="scroll-slim mt-3 overflow-x-auto rounded-lg bg-foreground p-4 font-mono text-[11px] leading-relaxed text-background">
          {sql.trim()}
        </pre>
      )}
    </div>
  )
}

export function Section({
  title,
  action,
  children,
  className,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('rounded-xl border border-border bg-card p-5 sm:p-6', className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="paper-label min-w-0 text-muted-foreground">{title}</h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-xs text-muted-foreground">
      {children}
    </p>
  )
}

export function ErrorNote({ error }: { error: string | null }) {
  if (!error) return null
  return (
    <p role="alert" className="break-words rounded-lg border border-foreground px-3 py-2 font-mono text-[11px] leading-relaxed">
      ERROR: {error}
    </p>
  )
}

export function Loading() {
  return <p className="py-10 text-center text-xs text-muted-foreground">Loading…</p>
}

/** Shows a request's error, or the page once its data has arrived. */
export function Loaded<T>({
  state,
  children,
}: {
  state: { data: T | null; error: string | null; loading: boolean }
  children: (data: T) => ReactNode
}) {
  if (state.error) return <ErrorNote error={state.error} />
  if (state.loading && state.data === null) return <Loading />
  // Some endpoints legitimately return null (e.g. /teams/mine with no team).
  return <>{children(state.data as T)}</>
}

export function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-muted-foreground">
      <span>
        Page {page} of {pages}
      </span>
      <div className="flex gap-2">
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className="rounded-full border border-border px-3 py-1 hover:bg-secondary disabled:opacity-40">
          Previous
        </button>
        <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)} className="rounded-full border border-border px-3 py-1 hover:bg-secondary disabled:opacity-40">
          Next
        </button>
      </div>
    </div>
  )
}
