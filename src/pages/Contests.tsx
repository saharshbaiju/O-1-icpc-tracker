import { useEffect, useMemo, useState } from 'react'
import {
  CalendarClock,
  History,
  Plus,
  Radio,
  Swords,
  Timer,
  Trophy,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/StatCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  contestPerformance,
  contests,
  currentUser,
  formatDateTime,
  formatDuration,
  pastContests,
  people,
  upcomingContests,
} from '@/lib/data'
import type { Contest } from '@/lib/data'
import { cn } from '@/lib/utils'

const PROBLEM_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

interface Cellz {
  state: 'ac' | 'wa' | 'none'
  attempts: number
  minute: number
}

/** Deterministic scoreboard for the live round. */
const SCOREBOARD = (() => {
  const roster = [
    { name: currentUser.name, handle: currentUser.handle, avatar: currentUser.avatar, me: true },
    ...people.slice(0, 7).map((p) => ({
      name: p.name,
      handle: p.handle,
      avatar: p.avatar,
      me: false,
    })),
  ]

  return roster
    .map((r, i) => {
      const cells: Cellz[] = PROBLEM_LETTERS.map((_, j) => {
        const seed = (i * 7 + j * 13) % 11
        if (seed < 4)
          return { state: 'ac', attempts: 1 + (seed % 3), minute: 18 + seed * 11 + j * 6 }
        if (seed < 6) return { state: 'wa', attempts: 1 + (seed % 3), minute: 0 }
        return { state: 'none', attempts: 0, minute: 0 }
      })
      const solved = cells.filter((c) => c.state === 'ac').length
      const penalty = cells.reduce(
        (sum, c) => (c.state === 'ac' ? sum + c.minute + (c.attempts - 1) * 20 : sum),
        0
      )
      return { ...r, cells, solved, penalty }
    })
    .sort((a, b) => b.solved - a.solved || a.penalty - b.penalty)
    .map((row, i) => ({ ...row, rank: i + 1 }))
})()

function useCountdown(seconds: number) {
  const [left, setLeft] = useState(seconds)
  useEffect(() => {
    const id = setInterval(() => setLeft((v) => (v > 0 ? v - 1 : 0)), 1000)
    return () => clearInterval(id)
  }, [])
  const h = String(Math.floor(left / 3600)).padStart(2, '0')
  const m = String(Math.floor((left % 3600) / 60)).padStart(2, '0')
  const s = String(left % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

function PerfTooltip({
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
      <p className="text-sm font-medium">Rank #{payload[0]?.value}</p>
    </div>
  )
}

function ContestCard({ c }: { c: Contest }) {
  const ended = c.status === 'ended'
  return (
    <Card className="flex flex-col p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{c.platform}</Badge>
        <Badge variant={c.type === 'Mock ICPC' ? 'default' : 'outline'}>
          {c.type}
        </Badge>
        {c.status === 'live' && (
          <Badge variant="destructive">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" />
            Live
          </Badge>
        )}
      </div>

      <h3 className="mt-4 text-base font-medium leading-snug tracking-tight">
        {c.name}
      </h3>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <CalendarClock className="h-3.5 w-3.5" />
          {formatDateTime(c.startsAt)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Timer className="h-3.5 w-3.5" />
          {formatDuration(c.durationMins)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Swords className="h-3.5 w-3.5" />
          {c.problems} problems
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          {compact(c.participants)}
        </span>
      </div>

      {ended && c.rank !== undefined && (
        <div className="mt-4 flex items-center gap-4 rounded-2xl bg-secondary/50 px-4 py-3">
          <div>
            <p className="text-lg font-medium tabular-nums">#{c.rank}</p>
            <p className="text-[11px] text-muted-foreground">Your rank</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-lg font-medium tabular-nums">
              {c.solved}/{c.problems}
            </p>
            <p className="text-[11px] text-muted-foreground">Solved</p>
          </div>
        </div>
      )}

      <Button
        size="sm"
        variant={c.status === 'live' ? 'contrast' : ended ? 'secondary' : 'default'}
        className="mt-auto w-full pt-0 [margin-top:1.25rem]"
      >
        {c.status === 'live'
          ? 'Enter contest'
          : ended
            ? 'View results'
            : 'Register'}
      </Button>
    </Card>
  )
}

export default function Contests() {
  const [createOpen, setCreateOpen] = useState(false)
  const live = contests.find((c) => c.status === 'live')
  const clock = useCountdown(6442)

  const stats = useMemo(() => {
    const ranks = pastContests.map((c) => c.rank ?? 0).filter(Boolean)
    const best = Math.min(...ranks)
    const avg = Math.round(ranks.reduce((a, b) => a + b, 0) / ranks.length)
    const solved = pastContests.reduce((n, c) => n + (c.solved ?? 0), 0)
    return { played: pastContests.length + 14, best, avg, solved: solved + 78 }
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contests"
        description="Run five-hour mock ICPC sets or short virtual rounds, watch the scoreboard move in real time, and feed every submission back into your analytics."
        actions={
          <Button size="pill" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Create virtual contest
          </Button>
        }
      />

      {/* -------------------------------------------------- Live banner */}
      {live && (
        <Card className="relative overflow-hidden p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_320px_at_15%_0%,hsl(var(--primary)/0.30),transparent_70%)]"
          />
          <div className="relative flex flex-wrap items-center justify-between gap-8">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" />
                  Live now
                </Badge>
                <Badge variant="secondary">{live.type}</Badge>
              </div>
              <h2
                className="mt-4 text-3xl leading-tight tracking-tight"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                {live.name}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {live.problems} problems · {compact(live.participants)} competing ·{' '}
                {formatDuration(live.durationMins)} format
              </p>
            </div>

            <div className="flex flex-col items-start gap-4 sm:items-end">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Time remaining
                </p>
                <p className="mt-1 font-mono text-4xl font-medium tabular-nums tracking-tight">
                  {clock}
                </p>
              </div>
              <Button variant="contrast" size="pill">
                Enter contest <Swords className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* -------------------------------------------------- Stats */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Contests played"
          value={stats.played}
          delta={8}
          hint="Across all judges"
          icon="Swords"
          accent="primary"
        />
        <StatCard
          label="Best rank"
          value={`#${stats.best}`}
          hint="Team Relay — Round 3"
          icon="Trophy"
          accent="lime"
        />
        <StatCard
          label="Problems in contest"
          value={stats.solved}
          delta={14}
          hint="Accepted during rounds"
          icon="Target"
          accent="chart-3"
        />
        <StatCard
          label="Average rank"
          value={`#${stats.avg}`}
          delta={-11}
          hint="Lower is better"
          icon="ChartSpline"
          accent="chart-4"
        />
      </div>

      {/* -------------------------------------------------- Tabs */}
      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="live">Live</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingContests
              .filter((c) => c.status === 'upcoming')
              .map((c) => (
                <ContestCard key={c.id} c={c} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="live">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingContests
              .filter((c) => c.status === 'live')
              .map((c) => (
                <ContestCard key={c.id} c={c} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="past">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pastContests.map((c) => (
              <ContestCard key={c.id} c={c} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* -------------------------------------------------- Scoreboard */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-medium">Live scoreboard</h2>
          </div>
          <span className="text-xs text-muted-foreground">
            Frozen in the last hour · {live?.name}
          </span>
        </div>

        <div className="mt-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">Rank</TableHead>
                <TableHead>Coder</TableHead>
                <TableHead className="w-16">Solved</TableHead>
                <TableHead className="w-20">Penalty</TableHead>
                {PROBLEM_LETTERS.map((l) => (
                  <TableHead key={l} className="w-14 text-center">
                    {l}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {SCOREBOARD.map((row) => (
                <TableRow
                  key={row.handle}
                  className={cn(
                    row.me && 'bg-primary/10 ring-1 ring-inset ring-primary/30'
                  )}
                >
                  <TableCell className="tabular-nums">
                    <span
                      className={cn(
                        'font-medium',
                        row.rank === 1 && 'text-warning'
                      )}
                    >
                      {row.rank}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <img
                        src={row.avatar}
                        alt=""
                        className="h-7 w-7 shrink-0 rounded-full bg-secondary"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{row.name}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          @{row.handle}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums">{row.solved}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {row.penalty}
                  </TableCell>
                  {row.cells.map((c, i) => (
                    <TableCell key={i} className="px-1.5 text-center">
                      <div
                        className={cn(
                          'rounded-lg px-1.5 py-1.5 text-[11px] leading-tight tabular-nums',
                          c.state === 'ac' && 'bg-success/20 text-success',
                          c.state === 'wa' && 'bg-destructive/15 text-destructive',
                          c.state === 'none' && 'bg-secondary/60 text-muted-foreground'
                        )}
                      >
                        {c.state === 'ac' ? (
                          <>
                            +{c.attempts > 1 ? c.attempts - 1 : ''}
                            <span className="block opacity-70">{c.minute}</span>
                          </>
                        ) : c.state === 'wa' ? (
                          <>
                            −{c.attempts}
                            <span className="block opacity-0">·</span>
                          </>
                        ) : (
                          <>
                            ·<span className="block opacity-0">·</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* -------------------------------------------------- History */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-medium">Rank history</h2>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Lower bars are better finishes.
          </p>

          <div className="mt-6 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={contestPerformance}
                margin={{ top: 4, right: 4, bottom: 0, left: -18 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  reversed
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                />
                <Tooltip content={<PerfTooltip />} cursor={false} />
                <Bar dataKey="rank" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                  {contestPerformance.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        entry.delta >= 0
                          ? 'hsl(var(--primary))'
                          : 'hsl(var(--destructive))'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-medium">Contest history</h2>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/app/analytics">Full analytics</Link>
            </Button>
          </div>

          <div className="mt-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contest</TableHead>
                  <TableHead>Rank</TableHead>
                  <TableHead>Solved</TableHead>
                  <TableHead className="text-right">Delta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contestPerformance.map((c) => (
                  <TableRow key={c.name}>
                    <TableCell className="text-sm">{c.name}</TableCell>
                    <TableCell className="tabular-nums">#{c.rank}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {c.solved}/{c.total}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          'text-sm font-medium tabular-nums',
                          c.delta >= 0 ? 'text-success' : 'text-destructive'
                        )}
                      >
                        {c.delta >= 0 ? '+' : ''}
                        {c.delta}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* -------------------------------------------------- Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a virtual contest</DialogTitle>
            <DialogDescription>
              Pick a format and a problem set — O(1) handles the timer, penalties
              and scoreboard.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="contest-name">Contest name</Label>
              <Input
                id="contest-name"
                placeholder="e.g. Team Warmup — Graphs & Flows"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Format</Label>
                <Select defaultValue="Virtual">
                  <SelectTrigger>
                    <SelectValue placeholder="Format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Virtual">Virtual</SelectItem>
                    <SelectItem value="Mock ICPC">Mock ICPC</SelectItem>
                    <SelectItem value="Practice">Practice</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Duration</Label>
                <Select defaultValue="300">
                  <SelectTrigger>
                    <SelectValue placeholder="Duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="90">90 minutes</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="180">3 hours</SelectItem>
                    <SelectItem value="300">5 hours (ICPC)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="contest-problems">Problems</Label>
                <Input id="contest-problems" type="number" defaultValue={11} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contest-start">Starts at</Label>
                <Input
                  id="contest-start"
                  type="datetime-local"
                  defaultValue="2026-08-01T18:00"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-secondary/40 px-4 py-3">
              <div>
                <p className="text-sm">Public contest</p>
                <p className="text-xs text-muted-foreground">
                  Anyone on O(1) can register and appear on the scoreboard.
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setCreateOpen(false)}>Create contest</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
