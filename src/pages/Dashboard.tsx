import { useMemo, useState } from 'react'
import {
  ArrowUpRight,
  CalendarClock,
  ChevronRight,
  Flame,
  MoreHorizontal,
  Play,
  Swords,
  Target,
  Trophy,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAuth } from '@/lib/auth'
import {
  activity,
  compact,
  formatDateTime,
  heatmap,
  practiceGrid,
  ratingHistory,
  sheets,
  solvedByMonth,
  upcomingContests,
} from '@/lib/data'
import { cn } from '@/lib/utils'

const PERIODS = ['Week', 'Month', 'Year'] as const

const KIND_ICON = {
  solved: Target,
  contest: Trophy,
  badge: Zap,
  sheet: Play,
  team: Swords,
  comment: MoreHorizontal,
} as const

const KIND_TINT = {
  solved: 'bg-success/15 text-success',
  contest: 'bg-primary/15 text-primary',
  badge: 'bg-lime/15 text-lime',
  sheet: 'bg-chart-3/15 text-chart-3',
  team: 'bg-chart-4/15 text-chart-4',
  comment: 'bg-secondary text-muted-foreground',
} as const

/* Thin vertical bars echoing the momentum strip in the reference layout. */
function MomentumBars({
  data,
  tint,
}: {
  data: number[]
  tint: 'primary' | 'lime'
}) {
  const max = Math.max(...data, 1)
  return (
    <div className="flex h-24 items-end gap-[3px]">
      {data.map((v, i) => (
        <div
          key={i}
          className={cn(
            'flex-1 rounded-sm',
            tint === 'primary' ? 'bg-primary' : 'bg-lime'
          )}
          style={{
            height: `${Math.max(6, (v / max) * 100)}%`,
            opacity: 0.35 + (v / max) * 0.65,
          }}
        />
      ))}
    </div>
  )
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value?: number | string }[]
  label?: string | number
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 shadow-xl">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-medium">{payload[0]?.value} rating</p>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>('Month')

  const firstName = user?.name.split(' ')[0] ?? 'there'

  /* Recent daily solve counts drive both momentum strips. */
  const recent = useMemo(() => heatmap.slice(-56).map((d) => d.count), [])
  const momentumA = recent.slice(0, 28)
  const momentumB = recent.slice(28)

  const monthTotal = solvedByMonth[solvedByMonth.length - 1]
  const solvedThisMonth = monthTotal.easy + monthTotal.medium + monthTotal.hard

  const activeSheets = sheets.filter((s) => s.completed < s.total).slice(0, 3)
  const nextContests = upcomingContests.slice(0, 3)

  /* Grid of practice intensity, mirroring the "activity by time" panel. */
  const slots = [...new Set(practiceGrid.map((c) => c.slot))]
  const days = [...new Set(practiceGrid.map((c) => c.day))]

  return (
    <div className="space-y-5">
      {/* -------------------------------------------------- Greeting */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1
          className="text-4xl leading-tight tracking-tight sm:text-5xl"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Welcome back,{' '}
          <span className="text-muted-foreground">{firstName}</span>
        </h1>

        <div className="inline-flex items-center gap-1 self-start rounded-full border border-border/70 bg-card p-1 sm:self-auto">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'rounded-full px-5 py-1.5 text-sm transition-colors',
                period === p
                  ? 'bg-foreground font-medium text-background'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* -------------------------------------------------- Hero stats */}
      <div className="grid gap-5 lg:grid-cols-12">
        <Card className="p-6 lg:col-span-4">
          <p className="text-sm text-muted-foreground">Current rating</p>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-5xl font-medium tracking-tight">
              {user?.rating}
            </span>
            <span className="mb-1.5 inline-flex items-center gap-0.5 text-sm font-medium text-success">
              <ArrowUpRight className="h-4 w-4" />
              +6.4%
            </span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Peak rating:{' '}
            <span className="text-foreground">{user?.maxRating}</span> ·{' '}
            <span className="text-primary">{user?.rank}</span>
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button size="pill" variant="contrast" asChild>
              <Link to="/app/problems">
                Practice <Target className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="pill" variant="secondary" asChild>
              <Link to="/app/contests">
                Contests <Swords className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="icon" variant="secondary" className="rounded-full" asChild>
              <Link to="/app/analytics" aria-label="Open analytics">
                <MoreHorizontal />
              </Link>
            </Button>
          </div>
        </Card>

        <Card className="grid gap-6 p-6 sm:grid-cols-2 lg:col-span-8">
          <div className="sm:border-r sm:border-border/60 sm:pr-6">
            <p className="text-2xl font-medium tracking-tight">
              {solvedThisMonth}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Problems solved · {period.toLowerCase()}
            </p>
            <div className="mt-6">
              <MomentumBars data={momentumA} tint="primary" />
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <Badge variant="default">+23%</Badge>
              <span className="text-muted-foreground">vs. previous period</span>
            </div>
          </div>

          <div>
            <p className="text-2xl font-medium tracking-tight">
              {user?.streak} days
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Current practice streak
            </p>
            <div className="mt-6">
              <MomentumBars data={momentumB} tint="lime" />
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <Badge variant="lime">
                <Flame className="h-3 w-3" /> Longest 61
              </Badge>
              <span className="text-muted-foreground">unbroken through July</span>
            </div>
          </div>
        </Card>
      </div>

      {/* -------------------------------------------------- Charts row */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Rating progression */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-medium">Rating progression</h2>
            </div>
            <Button variant="ghost" size="icon-sm" asChild>
              <Link to="/app/analytics" aria-label="Open analytics">
                <ArrowUpRight />
              </Link>
            </Button>
          </div>

          <div className="mt-6 h-[190px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={ratingHistory}
                margin={{ top: 4, right: 4, bottom: 0, left: -28 }}
              >
                <defs>
                  <linearGradient id="ratingFill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="hsl(var(--lime))"
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="100%"
                      stopColor="hsl(var(--lime))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
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
                  interval={1}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  domain={['dataMin - 100', 'dataMax + 100']}
                />
                <Tooltip content={<ChartTooltip />} cursor={false} />
                <Area
                  type="monotone"
                  dataKey="rating"
                  stroke="hsl(var(--lime))"
                  strokeWidth={2}
                  fill="url(#ratingFill)"
                  dot={false}
                  activeDot={{ r: 4, fill: 'hsl(var(--lime))' }}
                
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-lime" /> Rating
            </span>
            <span>12 contests · +643 net</span>
          </div>
        </Card>

        {/* Practice intensity grid */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-medium">Practice by time</h2>
            </div>
            <Button variant="ghost" size="icon-sm" asChild>
              <Link to="/app/analytics" aria-label="Open analytics">
                <ArrowUpRight />
              </Link>
            </Button>
          </div>

          <div className="mt-6 overflow-x-auto">
            <div className="min-w-[240px]">
              <div className="mb-2 grid grid-cols-[38px_repeat(7,1fr)] gap-1.5">
                <span />
                {days.map((d) => (
                  <span
                    key={d}
                    className="text-center text-[10px] text-muted-foreground"
                  >
                    {d}
                  </span>
                ))}
              </div>

              {slots.map((slot) => (
                <div
                  key={slot}
                  className="mb-1.5 grid grid-cols-[38px_repeat(7,1fr)] items-center gap-1.5"
                >
                  <span className="text-[10px] text-muted-foreground">
                    {slot}
                  </span>
                  {days.map((day) => {
                    const cell = practiceGrid.find(
                      (c) => c.day === day && c.slot === slot
                    )
                    const v = cell?.value ?? 0
                    return (
                      <UiTooltip key={day}>
                        <TooltipTrigger asChild>
                          <div
                            className="h-6 rounded-md transition-transform hover:scale-110"
                            style={{
                              backgroundColor:
                                v === 0
                                  ? 'hsl(var(--secondary))'
                                  : `hsl(var(--primary) / ${0.25 + v * 0.19})`,
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          {day} {slot} · {v} session{v === 1 ? '' : 's'}
                        </TooltipContent>
                      </UiTooltip>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
            Less
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="h-2.5 w-2.5 rounded-[3px]"
                style={{
                  backgroundColor:
                    i === 0
                      ? 'hsl(var(--secondary))'
                      : `hsl(var(--primary) / ${0.25 + i * 0.19})`,
                }}
              />
            ))}
            More
          </div>
        </Card>

        {/* Recent activity */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-medium">Recent activity</h2>
            </div>
            <Button variant="ghost" size="icon-sm" asChild>
              <Link to="/app/profile" aria-label="Open profile">
                <ArrowUpRight />
              </Link>
            </Button>
          </div>

          <ul className="mt-5 space-y-1">
            {activity.slice(0, 6).map((a) => {
              const Icon = KIND_ICON[a.kind]
              return (
                <li
                  key={a.id}
                  className="flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-secondary/50"
                >
                  <span
                    className={cn(
                      'mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg',
                      KIND_TINT[a.kind]
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{a.text}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {a.detail}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {a.time}
                  </span>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>

      {/* -------------------------------------------------- Bottom row */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Upcoming contests */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Swords className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-medium">Upcoming contests</h2>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/app/contests">
                View all <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <ul className="mt-5 divide-y divide-border/50">
            {nextContests.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center gap-3 py-3.5 first:pt-0"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                  <Swords className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.platform} · {c.problems} problems ·{' '}
                    {compact(c.participants)} registered
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {c.status === 'live' ? (
                    <Badge variant="destructive">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" />
                      Live now
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(c.startsAt)}
                    </span>
                  )}
                  <Button size="sm" variant="secondary">
                    {c.status === 'live' ? 'Enter' : 'Register'}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        {/* Active sheets */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-medium">Active sheets</h2>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/app/sheets">
                All <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <ul className="mt-5 space-y-5">
            {activeSheets.map((s) => {
              const pct = Math.round((s.completed / s.total) * 100)
              return (
                <li key={s.id}>
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-sm">{s.title}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {s.completed}/{s.total}
                    </span>
                  </div>
                  <Progress value={pct} className="mt-2.5" />
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    {s.author} · due{' '}
                    {new Date(s.deadline).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>
    </div>
  )
}
