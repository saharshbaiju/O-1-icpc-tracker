import { useMemo, useState } from 'react'
import {
  ArrowUpRight,
  ChevronRight,
  ClipboardList,
  Flame,
  MoreHorizontal,
  Play,
  Swords,
  Target,
  Trophy,
  Users,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/lib/auth'
import {
  activity,
  compact,
  formatDateTime,
  heatmap,
  myTeam,
  ratingColor,
  sheets,
  solvedByMonth,
  topicMastery,
  upcomingContests,
} from '@/lib/data'
import { cn } from '@/lib/utils'

const PERIODS = ['Week', 'Month', 'Year'] as const

const KIND_ICON = {
  solved: Target,
  contest: Trophy,
  sheet: Play,
  team: Users,
} as const

const KIND_TINT = {
  solved: 'bg-success/15 text-success',
  contest: 'bg-primary/15 text-primary',
  sheet: 'bg-chart-3/15 text-chart-3',
  team: 'bg-chart-4/15 text-chart-4',
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

  /* The two topics the whole squad is weakest at — mirrors the Teams radar. */
  const teamWeakest = [...topicMastery]
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, 2)

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
              <Link to="/app/sheets">
                Sheets <ClipboardList className="h-4 w-4" />
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

      {/* -------------------------------------------------- Team + activity */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Team overview */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-medium">Your team</h2>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/app/teams">
                Manage <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
              <Users className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-medium">{myTeam.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {myTeam.university} · Coached by {myTeam.coach}
              </p>
            </div>
            <Badge variant="default">
              <Trophy className="h-3.5 w-3.5" /> Rank #{myTeam.rank}
            </Badge>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60">
            {[
              { label: 'Team rating', value: myTeam.rating },
              { label: 'Contests', value: myTeam.contests },
              { label: 'Problems solved', value: myTeam.solved },
            ].map((s) => (
              <div key={s.label} className="bg-card px-4 py-3.5">
                <p className="text-lg font-medium tabular-nums">{s.value}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          <ul className="mt-5 divide-y divide-border/50">
            {myTeam.members.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-3 first:pt-0">
                <img
                  src={m.avatar}
                  alt=""
                  className="h-9 w-9 shrink-0 rounded-full bg-secondary"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {m.role}
                  </p>
                </div>
                <span
                  className={cn(
                    'text-sm font-medium tabular-nums',
                    ratingColor(m.rating)
                  )}
                >
                  {m.rating}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-5 rounded-2xl border border-border/60 bg-secondary/30 p-4">
            <p className="text-xs text-muted-foreground">
              Weakest combined coverage
            </p>
            <p className="mt-1.5 text-sm">
              {teamWeakest.map((w) => w.topic).join(' and ')}
            </p>
            <div className="mt-3 space-y-2.5">
              {teamWeakest.map((w) => (
                <div key={w.topic}>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{w.topic}</span>
                    <span className="tabular-nums">{w.mastery}%</span>
                  </div>
                  <Progress value={w.mastery} className="mt-1 h-1.5" />
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Recent activity */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-medium">Recent activity</h2>
            </div>
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
              <Link to="/app/calendar">
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
