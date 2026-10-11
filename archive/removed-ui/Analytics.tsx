import { useMemo, useState } from 'react'
import { CalendarDays, ChartSpline, Layers, PieChart as PieIcon, Target } from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/StatCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth } from '@/lib/auth'
import {
  compact,
  contestPerformance,
  heatmap,
  platformSplit,
  ratingHistory,
  solvedByMonth,
  topicMastery,
} from '@/lib/data'
import { cn } from '@/lib/utils'

const PERIODS = ['Week', 'Month', 'Year', 'All time'] as const

const MONTH_LABELS = [
  'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan',
  'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
]

function ChartBox({
  active,
  payload,
  label,
  suffix,
}: {
  active?: boolean
  payload?: { value?: number | string; name?: string; color?: string }[]
  label?: string | number
  suffix?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2">
      <p className="text-[11px] text-muted-foreground">
        {label}
      </p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-medium">
          {p.name ? `${p.name}: ` : ''}
          {p.value}
          {suffix ?? ''}
        </p>
      ))}
    </div>
  )
}

function masteryBar(m: number) {
  if (m >= 70) return 'bg-foreground'
  if (m >= 45) return 'bg-chart-2'
  return 'bg-chart-3'
}

export default function Analytics() {
  const { user } = useAuth()
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>('Year')

  const peak = useMemo(
    () => Math.max(...ratingHistory.map((r) => r.rating)),
    []
  )

  const sortedMastery = useMemo(
    () => [...topicMastery].sort((a, b) => b.mastery - a.mastery),
    []
  )
  const weakest = sortedMastery.slice(-2)

  const totalSolves = useMemo(
    () => platformSplit.reduce((n, p) => n + p.value, 0),
    []
  )

  const heatStats = useMemo(() => {
    let total = 0
    let best = 0
    let run = 0
    for (const d of heatmap) {
      total += d.count
      if (d.count > 0) {
        run += 1
        best = Math.max(best, run)
      } else {
        run = 0
      }
    }
    return { total, best }
  }, [])

  /* 53 columns of 7 days for the GitHub-style grid. */
  const weeks = useMemo(() => {
    const out: { date: string; count: number }[][] = []
    for (let i = 0; i < heatmap.length; i += 7) {
      out.push(heatmap.slice(i, i + 7))
    }
    return out
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance Analytics"
        description="Rating curves, topic mastery, submission density and contest outcomes — the numbers that tell you what to fix next, not just what you solved."
        actions={
          <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-xs transition-colors',
                  period === p
                    ? 'bg-foreground font-medium text-background'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {p}
              </button>
            ))}
          </div>
        }
      />

      {/* -------------------------------------------------- Stats */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Current rating"
          value={user?.rating ?? 0}
          delta={6}
          hint={`Peak ${peak}`}
          icon="Trophy"
          accent="primary"
        />
        <StatCard
          label="Problems solved"
          value={user?.solved ?? 0}
          delta={12}
          hint="All judges combined"
          icon="Target"
          accent="primary"
        />
        <StatCard
          label="Contests"
          value={18}
          delta={9}
          hint="Rated rounds entered"
          icon="Swords"
          accent="primary"
        />
        <StatCard
          label="Current streak"
          value={`${user?.streak ?? 0}d`}
          delta={4}
          hint={`Longest ${heatStats.best} days`}
          icon="Flame"
          accent="primary"
        />
      </div>

      {/* -------------------------------------------------- Rating + donut */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center gap-2">
            <ChartSpline className="h-4 w-4 text-primary" />
            <h2 className="paper-label text-muted-foreground">Rating progression</h2>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Twelve rated rounds · net {ratingHistory[ratingHistory.length - 1].rating - ratingHistory[0].rating} points
          </p>

          <div className="mt-6 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={ratingHistory}
                margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  domain={['dataMin - 120', 'dataMax + 120']}
                />
                <Tooltip content={<ChartBox />} cursor={false} />
                <ReferenceLine
                  y={peak}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="4 4"
                  label={{
                    value: `Peak ${peak}`,
                    position: 'insideTopRight',
                    fill: 'hsl(var(--muted-foreground))',
                    fontSize: 11,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="rating"
                  stroke="hsl(var(--foreground))"
                  strokeWidth={1.5}
                  fill="hsl(var(--muted))"
                  dot={false}
                  activeDot={{ r: 4, fill: 'hsl(var(--foreground))' }}
                
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-foreground" /> Rating
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-px w-4 border-t border-dashed border-muted-foreground" /> Peak
            </span>
            <span>Showing: {period.toLowerCase()}</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2">
            <PieIcon className="h-4 w-4 text-primary" />
            <h2 className="paper-label text-muted-foreground">Solves by platform</h2>
          </div>

          <div className="relative mt-4 h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={platformSplit}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                  stroke="none"
                  isAnimationActive={false}
                >
                  {platformSplit.map((entry, i) => (
                    <Cell key={entry.name} fill={`hsl(var(--chart-${i + 1}))`} />
                  ))}
                </Pie>
                <Tooltip content={<ChartBox />} />
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="text-center">
                <p className="text-2xl font-medium tabular-nums tracking-tight">
                  {compact(totalSolves)}
                </p>
                <p className="text-[11px] text-muted-foreground">total solves</p>
              </div>
            </div>
          </div>

          <ul className="mt-5 space-y-2.5">
            {platformSplit.map((p, i) => (
              <li key={p.name} className="flex items-center gap-2.5 text-sm">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: `hsl(var(--chart-${i + 1}))` }}
                />
                <span className="flex-1 truncate text-muted-foreground">
                  {p.name}
                </span>
                <span className="tabular-nums">{p.value}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* -------------------------------------------------- Stacked + mastery */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <h2 className="paper-label text-muted-foreground">Problems solved by month</h2>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Split by difficulty — the hard band is the one that moves rating.
          </p>

          <div className="mt-6 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={solvedByMonth}
                margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                />
                <Tooltip content={<ChartBox />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.6 }} />
                <Bar dataKey="easy" stackId="a" fill="hsl(var(--easy))" 
                  isAnimationActive={false}
                />
                <Bar dataKey="medium" stackId="a" fill="hsl(var(--medium))" 
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="hard"
                  stackId="a"
                  fill="hsl(var(--hard))"
                  radius={[2, 2, 0, 0]}
                
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-5 text-xs text-muted-foreground">
            {[
              { label: 'Easy', cls: 'bg-easy' },
              { label: 'Medium', cls: 'bg-medium' },
              { label: 'Hard', cls: 'bg-hard' },
            ].map((l) => (
              <span key={l.label} className="flex items-center gap-1.5">
                <span className={cn('h-2 w-2 rounded-full', l.cls)} /> {l.label}
              </span>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <h2 className="paper-label text-muted-foreground">Topic mastery</h2>
          </div>

          <ul className="mt-6 space-y-4">
            {sortedMastery.map((t) => (
              <li key={t.topic}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate">{t.topic}</span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {t.solved} / {t.total} · {t.mastery}%
                  </span>
                </div>
                <Progress
                  value={t.mastery}
                  className="mt-2 h-1.5"
                  indicatorClassName={masteryBar(t.mastery)}
                />
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-lg bg-foreground text-background px-4 py-3">
            <p className="text-sm">
              Focus next:{' '}
              <span className="font-medium">
                {weakest.map((w) => w.topic).join(' and ')}
              </span>
            </p>
            <p className="mt-1 text-xs text-background/70">
              Both sit under 30% coverage and appear in most regional sets.
            </p>
          </div>
        </Card>
      </div>

      {/* -------------------------------------------------- Heatmap */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <h2 className="paper-label text-muted-foreground">Submission heatmap</h2>
          </div>
          <span className="text-xs text-muted-foreground">
            {compact(heatStats.total)} submissions · longest streak{' '}
            {heatStats.best} days
          </span>
        </div>

        <div className="scroll-slim mt-6 overflow-x-auto pb-2">
          <div className="min-w-[900px]">
            <div className="mb-2 flex gap-[3px] pl-1">
              {MONTH_LABELS.map((m) => (
                <span
                  key={m}
                  className="w-[calc((100%/12))] text-[10px] text-muted-foreground"
                >
                  {m}
                </span>
              ))}
            </div>

            <div className="flex gap-[3px]">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((d) => (
                    <UiTooltip key={d.date}>
                      <TooltipTrigger asChild>
                        <div
                          className="h-3 w-3 rounded-[2px] hover:scale-125"
                          style={{
                            backgroundColor:
                              d.count === 0
                                ? 'hsl(var(--muted))'
                                : `hsl(var(--foreground) / ${Math.min(1, 0.22 + d.count * 0.11)})`,
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        {d.count} submission{d.count === 1 ? '' : 's'} · {d.date}
                      </TooltipContent>
                    </UiTooltip>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
          Less
          {[0, 1, 3, 5, 8].map((c) => (
            <span
              key={c}
              className="h-3 w-3 rounded-[3px]"
              style={{
                backgroundColor:
                  c === 0
                    ? 'hsl(var(--muted))'
                    : `hsl(var(--foreground) / ${Math.min(1, 0.22 + c * 0.11)})`,
              }}
            />
          ))}
          More
        </div>
      </Card>

      {/* -------------------------------------------------- Contest table */}
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <ChartSpline className="h-4 w-4 text-primary" />
          <h2 className="paper-label text-muted-foreground">Contest performance</h2>
        </div>

        <div className="mt-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contest</TableHead>
                <TableHead>Rank</TableHead>
                <TableHead>Solved</TableHead>
                <TableHead>Completion</TableHead>
                <TableHead className="text-right">Rating delta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contestPerformance.map((c) => {
                const pct = Math.round((c.solved / c.total) * 100)
                return (
                  <TableRow key={c.name}>
                    <TableCell className="text-sm font-medium">{c.name}</TableCell>
                    <TableCell className="tabular-nums">#{c.rank}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {c.solved} / {c.total}
                    </TableCell>
                    <TableCell className="w-40">
                      <div className="flex items-center gap-2">
                        <Progress value={pct} className="h-1.5" />
                        <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                          {pct}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          'text-sm font-medium tabular-nums',
                          c.delta >= 0 ? 'text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {c.delta >= 0 ? '+' : ''}
                        {c.delta}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        <Button variant="ghost" size="sm" className="mt-4">
          Export as CSV
        </Button>
      </Card>
    </div>
  )
}
