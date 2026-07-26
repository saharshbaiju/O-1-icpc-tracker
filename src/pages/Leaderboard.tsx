import { useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Flame,
  Medal,
  Minus,
  Sparkles,
  Trophy,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  compact,
  leaderboard,
  myLeaderboardEntry,
  ratingColor,
} from '@/lib/data'
import type { LeaderboardEntry } from '@/lib/data'
import { cn } from '@/lib/utils'

const SCOPES = ['Global', 'My university', 'My team', 'Contest'] as const
const METRICS = [
  { key: 'rating', label: 'Rating' },
  { key: 'solved', label: 'Problems solved' },
  { key: 'xp', label: 'XP' },
  { key: 'streak', label: 'Streak' },
] as const

type MetricKey = (typeof METRICS)[number]['key']

function Delta({ value }: { value: number }) {
  if (value === 0)
    return (
      <span className="inline-flex items-center text-xs text-muted-foreground">
        <Minus className="h-3.5 w-3.5" />
      </span>
    )
  const up = value > 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium tabular-nums',
        up ? 'text-success' : 'text-destructive'
      )}
    >
      {up ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
      {Math.abs(value)}
    </span>
  )
}

function PodiumCard({
  entry,
  place,
}: {
  entry: LeaderboardEntry
  place: 1 | 2 | 3
}) {
  const tint = {
    1: 'text-warning',
    2: 'text-muted-foreground',
    3: 'text-chart-4',
  }[place]

  return (
    <Card
      className={cn(
        'relative flex flex-col items-center overflow-hidden p-6 text-center',
        place === 1 ? 'sm:-mt-6 sm:pb-10 sm:pt-10' : 'justify-end'
      )}
    >
      {place === 1 && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(400px_200px_at_50%_0%,hsl(var(--primary)/0.28),transparent_70%)]"
        />
      )}
      <div className="relative flex flex-col items-center">
        <Trophy className={cn('h-6 w-6', tint)} />
        <p className={cn('mt-1 text-xs font-medium', tint)}>#{place}</p>

        <img
          src={entry.avatar}
          alt=""
          className={cn(
            'mt-4 rounded-full bg-secondary ring-2',
            place === 1 ? 'h-20 w-20 ring-primary/50' : 'h-14 w-14 ring-border'
          )}
        />

        <p className="mt-3 text-sm font-medium">{entry.name}</p>
        <p className="text-xs text-muted-foreground">@{entry.handle}</p>

        <p
          className={cn(
            'mt-4 text-2xl font-medium tabular-nums tracking-tight',
            ratingColor(entry.rating)
          )}
        >
          {entry.rating}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {compact(entry.solved)} solved · {entry.contests} contests
        </p>
      </div>
    </Card>
  )
}

export default function Leaderboard() {
  const [scope, setScope] = useState<(typeof SCOPES)[number]>('Global')
  const [metric, setMetric] = useState<MetricKey>('rating')
  const [range, setRange] = useState('all')

  const ranked = useMemo(() => {
    const rows = [...leaderboard].sort((a, b) => b[metric] - a[metric])
    return rows.map((r, i) => ({ ...r, rank: i + 1 }))
  }, [metric])

  const podium = ranked.slice(0, 3)
  const rest = ranked.slice(3)

  const insights = useMemo(
    () => [
      {
        title: 'Biggest climber',
        person: ranked[4],
        stat: '+4 places this week',
        icon: Sparkles,
        tint: 'text-lime',
      },
      {
        title: 'Most problems this month',
        person: ranked[1],
        stat: `${compact(ranked[1].solved)} solved`,
        icon: Medal,
        tint: 'text-primary',
      },
      {
        title: 'Longest active streak',
        person: ranked[0],
        stat: `${ranked[0].streak} days`,
        icon: Flame,
        tint: 'text-warning',
      },
    ],
    [ranked]
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leaderboard"
        description="Global, university, team and per-contest rankings — filterable by time range and by the metric you actually care about."
        actions={
          <Button variant="outline" size="pill" asChild>
            <Link to="/app/analytics">Your analytics</Link>
          </Button>
        }
      />

      {/* -------------------------------------------------- Podium */}
      <div className="grid items-end gap-5 sm:grid-cols-3">
        <PodiumCard entry={podium[1]} place={2} />
        <PodiumCard entry={podium[0]} place={1} />
        <PodiumCard entry={podium[2]} place={3} />
      </div>

      {/* -------------------------------------------------- Filters */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {SCOPES.map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={cn(
                  'rounded-full border border-border/70 px-4 py-1.5 text-xs transition-colors',
                  scope === s
                    ? 'border-transparent bg-foreground font-medium text-background'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="month">This month</SelectItem>
                <SelectItem value="week">This week</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={metric}
              onValueChange={(v) => setMetric(v as MetricKey)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Metric" />
              </SelectTrigger>
              <SelectContent>
                {METRICS.map((m) => (
                  <SelectItem key={m.key} value={m.key}>
                    Sort by {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* -------------------------------------------------- Table */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-medium">{scope} rankings</h2>
          </div>
          <span className="text-xs text-muted-foreground">
            Ranked by {METRICS.find((m) => m.key === metric)?.label.toLowerCase()}
          </span>
        </div>

        <div className="mt-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Rank</TableHead>
                <TableHead>Coder</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>University</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Solved</TableHead>
                <TableHead>Contests</TableHead>
                <TableHead>Streak</TableHead>
                <TableHead className="text-right">XP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...podium, ...rest].map((e) => (
                <TableRow
                  key={e.id}
                  className={cn(e.rank <= 3 && 'bg-secondary/30')}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'font-medium tabular-nums',
                          e.rank === 1 && 'text-warning'
                        )}
                      >
                        {e.rank}
                      </span>
                      <Delta value={e.delta} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link
                      to={`/app/profile/${e.handle}`}
                      className="flex items-center gap-2.5 transition-colors hover:text-primary"
                    >
                      <img
                        src={e.avatar}
                        alt=""
                        className="h-8 w-8 shrink-0 rounded-full bg-secondary"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{e.name}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          @{e.handle}
                        </p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {e.team}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {e.university}
                  </TableCell>
                  <TableCell
                    className={cn('font-medium tabular-nums', ratingColor(e.rating))}
                  >
                    {e.rating}
                  </TableCell>
                  <TableCell className="tabular-nums">{e.solved}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {e.contests}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-sm tabular-nums">
                      <Flame className="h-3.5 w-3.5 text-warning" />
                      {e.streak}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {compact(e.xp)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* -------------------------------------------------- Your rank */}
      <Card className="border-primary/40 bg-primary/5 p-5">
        <div className="flex flex-wrap items-center gap-4">
          <Badge variant="default">Your position</Badge>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-medium tabular-nums">
              #{myLeaderboardEntry.rank}
            </span>
            <Delta value={myLeaderboardEntry.delta} />
          </div>
          <img
            src={myLeaderboardEntry.avatar}
            alt=""
            className="h-10 w-10 rounded-full bg-secondary"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {myLeaderboardEntry.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {myLeaderboardEntry.team} · {myLeaderboardEntry.university}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div>
              <p
                className={cn(
                  'font-medium tabular-nums',
                  ratingColor(myLeaderboardEntry.rating)
                )}
              >
                {myLeaderboardEntry.rating}
              </p>
              <p className="text-[11px] text-muted-foreground">Rating</p>
            </div>
            <div>
              <p className="font-medium tabular-nums">
                {myLeaderboardEntry.solved}
              </p>
              <p className="text-[11px] text-muted-foreground">Solved</p>
            </div>
            <div>
              <p className="font-medium tabular-nums">
                {myLeaderboardEntry.streak}
              </p>
              <p className="text-[11px] text-muted-foreground">Streak</p>
            </div>
          </div>

          <Button variant="contrast" size="pill" asChild>
            <Link to="/app/problems">Climb higher</Link>
          </Button>
        </div>
      </Card>

      {/* -------------------------------------------------- Insights */}
      <div className="grid gap-5 sm:grid-cols-3">
        {insights.map((i) => (
          <Card key={i.title} className="p-6">
            <div className="flex items-center gap-2">
              <i.icon className={cn('h-4 w-4', i.tint)} />
              <h2 className="text-sm font-medium">{i.title}</h2>
            </div>
            <div className="mt-5 flex items-center gap-3">
              <img
                src={i.person.avatar}
                alt=""
                className="h-11 w-11 rounded-full bg-secondary"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{i.person.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {i.stat}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
