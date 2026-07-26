import * as icons from 'lucide-react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

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

  const accentBg = {
    primary: 'bg-primary/15 text-primary',
    lime: 'bg-lime/15 text-lime',
    'chart-3': 'bg-chart-3/15 text-chart-3',
    'chart-4': 'bg-chart-4/15 text-chart-4',
    warning: 'bg-warning/15 text-warning',
  }[accent]

  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        {Icon && (
          <span className={cn('grid h-9 w-9 place-items-center rounded-xl', accentBg)}>
            <Icon className="h-[18px] w-[18px]" />
          </span>
        )}
      </div>
      <div className="mt-3 flex items-end gap-2">
        <span className="text-3xl font-medium tracking-tight">{value}</span>
        {delta !== undefined && (
          <span
            className={cn(
              'mb-1 inline-flex items-center gap-0.5 text-xs font-medium',
              delta >= 0 ? 'text-success' : 'text-destructive'
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
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  )
}
