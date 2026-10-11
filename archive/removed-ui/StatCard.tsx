import * as icons from 'lucide-react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/* The number is the card. Label above in small caps; icon is a thin outlined tile. Monochrome. */
export function StatCard({
  label,
  value,
  delta,
  hint,
  icon,
  accent = 'primary',
  className,
}: {
  label: string
  value: string | number
  delta?: number
  hint?: string
  icon?: string
  accent?: 'primary' | 'lime' | 'chart-3' | 'chart-4' | 'warning'
  className?: string
}) {
  const Icon = icon
    ? (icons as unknown as Record<string, icons.LucideIcon>)[icon]
    : null

  // Every accent maps to ink on paper; the prop is kept so callers don't break.
  void accent
  const accentBg = 'border border-border bg-card text-foreground'

  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="paper-label">{label}</p>
        {Icon && (
          <span className={cn('grid h-8 w-8 place-items-center rounded-lg', accentBg)}>
            <Icon className="h-4 w-4" strokeWidth={1.5} />
          </span>
        )}
      </div>
      <div className="mt-4 flex items-end gap-2">
        <span className="font-display text-3xl tracking-tight">{value}</span>
        {delta !== undefined && (
          <span
            className={cn(
              'mb-1 inline-flex items-center gap-0.5 text-xs font-medium',
              delta >= 0 ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {delta >= 0 ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  )
}
