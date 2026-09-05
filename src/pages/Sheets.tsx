import { useMemo, useState } from 'react'
import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  LibraryBig,
  ListChecks,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/lib/auth'
import {
  DIFFICULTIES,
  difficultyVariant,
  formatDate,
  people,
  problems,
  ROLE_LABEL,
  sheets,
  TOPICS,
} from '@/lib/data'
import type { Sheet } from '@/lib/data'
import { cn } from '@/lib/utils'

/** The product's "today" — all deadline maths is relative to this. */
const TODAY = new Date('2026-07-26T00:00:00')

/** Sheets a mentor has pushed to the signed-in student. */
const ASSIGNED_TO_ME = ['s-01', 's-02', 's-04', 's-06']

const ACCENT: Record<string, { tile: string; bar: string; rule: string }> = {
  'chart-1': { tile: 'bg-chart-1/15 text-chart-1', bar: 'bg-chart-1', rule: 'bg-chart-1' },
  'chart-2': { tile: 'bg-chart-2/15 text-chart-2', bar: 'bg-chart-2', rule: 'bg-chart-2' },
  'chart-3': { tile: 'bg-chart-3/15 text-chart-3', bar: 'bg-chart-3', rule: 'bg-chart-3' },
  'chart-4': { tile: 'bg-chart-4/15 text-chart-4', bar: 'bg-chart-4', rule: 'bg-chart-4' },
  'chart-5': { tile: 'bg-chart-5/15 text-chart-5', bar: 'bg-chart-5', rule: 'bg-chart-5' },
}

function accentFor(color: string) {
  return ACCENT[color] ?? ACCENT['chart-1']
}

function daysLeft(deadline: string) {
  const d = new Date(`${deadline}T00:00:00`)
  return Math.round((d.getTime() - TODAY.getTime()) / 86_400_000)
}

function deadlineTone(deadline: string) {
  const left = daysLeft(deadline)
  if (left < 0) return 'text-destructive'
  if (left <= 7) return 'text-warning'
  return 'text-muted-foreground'
}

function deadlineLabel(deadline: string) {
  const left = daysLeft(deadline)
  if (left < 0) return `Overdue by ${Math.abs(left)}d`
  if (left === 0) return 'Due today'
  return `${left}d left`
}

const TAB_LABEL = {
  assigned: 'Assigned to me',
  progress: 'In progress',
  completed: 'Completed',
  all: 'All sheets',
} as const

type TabKey = keyof typeof TAB_LABEL

export default function Sheets() {
  const { role } = useAuth()
  const canAuthor = role === 'mentor'

  const [tab, setTab] = useState<TabKey>('assigned')
  const [createOpen, setCreateOpen] = useState(false)
  const [checked, setChecked] = useState<string[]>(() =>
    problems.slice(0, 8).filter((p) => p.status === 'solved').map((p) => p.id)
  )

  const featured = sheets[0]
  const featuredProblems = useMemo(() => problems.slice(0, 8), [])
  const featuredAccent = accentFor(featured.color)
  const featuredPct = Math.round(
    (checked.length / featuredProblems.length) * 100
  )

  const byTab = useMemo<Record<TabKey, Sheet[]>>(
    () => ({
      assigned: sheets.filter((s) => ASSIGNED_TO_ME.includes(s.id)),
      progress: sheets.filter((s) => s.completed > 0 && s.completed < s.total),
      completed: sheets.filter((s) => s.completed >= s.total),
      all: sheets,
    }),
    []
  )

  const roster = useMemo(
    () =>
      people
        .filter((p) => p.role === 'student')
        .slice(0, 6)
        .map((p, i) => ({
          id: p.id,
          name: p.name,
          handle: p.handle,
          avatar: p.avatar,
          sheet: sheets[i % sheets.length].title,
          pct: 24 + ((i * 17) % 70),
        })),
    []
  )

  function toggleProblem(id: string) {
    setChecked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function SheetCard({ s }: { s: Sheet }) {
    const accent = accentFor(s.color)
    const pct = Math.round((s.completed / s.total) * 100)
    const done = s.completed >= s.total

    return (
      <Card className="flex flex-col overflow-hidden">
        <div className={cn('h-1 w-full', accent.rule)} />
        <div className="flex flex-1 flex-col p-6">
          <div className="flex items-start justify-between gap-3">
            <span
              className={cn(
                'grid h-11 w-11 shrink-0 place-items-center rounded-2xl',
                accent.tile
              )}
            >
              <ListChecks className="h-5 w-5" />
            </span>
            <Badge variant={difficultyVariant(s.difficulty)}>
              {s.difficulty}
            </Badge>
          </div>

          <h3 className="mt-4 text-base font-medium tracking-tight">{s.title}</h3>
          <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
            {s.description}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{s.author}</span>
            <Badge variant="secondary">{ROLE_LABEL[s.authorRole]}</Badge>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {s.topics.map((t) => (
              <Badge key={t} variant="outline">
                {t}
              </Badge>
            ))}
          </div>

          <div className="mt-5">
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-muted-foreground">
                {s.completed} / {s.total} solved
              </span>
              <span className="font-medium">{pct}%</span>
            </div>
            <Progress
              value={pct}
              className="mt-2"
              indicatorClassName={accent.bar}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            <span
              className={cn('inline-flex items-center gap-1.5', deadlineTone(s.deadline))}
            >
              <Clock className="h-3.5 w-3.5" />
              {formatDate(s.deadline)} · {deadlineLabel(s.deadline)}
            </span>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {s.assigned} assigned
            </span>
          </div>

          <div className="mt-5 flex items-center gap-2 pt-1">
            <Button
              size="sm"
              variant={done ? 'secondary' : 'contrast'}
              className="flex-1"
              asChild
            >
              <Link to="/app/problems">
                {done ? 'Review' : 'Continue'}
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            {done && (
              <span className="inline-flex items-center gap-1 text-xs text-success">
                <CheckCircle2 className="h-3.5 w-3.5" /> Done
              </span>
            )}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Practice Sheets"
        description="Topic-wise and custom problem sets curated by your mentors, with deadlines, progress tracking, and assignment history."
        actions={
          canAuthor ? (
            <Button size="pill" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> Create sheet
            </Button>
          ) : (
            <Button size="pill" variant="outline" asChild>
              <Link to="/app/resources">
                <LibraryBig className="h-4 w-4" /> Browse public sheets
              </Link>
            </Button>
          )
        }
      />

      {/* -------------------------------------------------- Tabs + grid */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            {(Object.keys(TAB_LABEL) as TabKey[]).map((k) => (
              <TabsTrigger key={k} value={k}>
                {TAB_LABEL[k]}
              </TabsTrigger>
            ))}
          </TabsList>
          <span className="text-xs text-muted-foreground">
            {byTab[tab].length} sheet{byTab[tab].length === 1 ? '' : 's'} ·{' '}
            {byTab[tab].reduce((n, s) => n + s.total, 0)} problems
          </span>
        </div>

        {(Object.keys(TAB_LABEL) as TabKey[]).map((k) => (
          <TabsContent key={k} value={k}>
            {byTab[k].length === 0 ? (
              <Card className="flex flex-col items-center gap-3 py-16 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-muted-foreground">
                  <ListChecks className="h-6 w-6" />
                </span>
                <p className="text-sm font-medium">Nothing here yet</p>
                <p className="max-w-sm text-xs text-muted-foreground">
                  Sheets appear here once a mentor assigns them or you start
                  solving.
                </p>
              </Card>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {byTab[k].map((s) => (
                  <SheetCard key={s.id} s={s} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* -------------------------------------------------- Featured sheet */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className={cn('p-6', canAuthor ? 'lg:col-span-2' : 'lg:col-span-3')}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  'grid h-11 w-11 shrink-0 place-items-center rounded-2xl',
                  featuredAccent.tile
                )}
              >
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-medium">Continue where you left off</h2>
                </div>
                <p className="mt-1 text-lg font-medium tracking-tight">
                  {featured.title}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {featured.author} · {featured.total} problems · due{' '}
                  {formatDate(featured.deadline)}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/app/problems">
                Open in repository <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <div className="mt-6">
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-muted-foreground">
                {checked.length} of {featuredProblems.length} checked in this
                section
              </span>
              <span className="font-medium">{featuredPct}%</span>
            </div>
            <Progress
              value={featuredPct}
              className="mt-2 h-2.5"
              indicatorClassName={featuredAccent.bar}
            />
          </div>

          <ul className="mt-5 divide-y divide-border/50">
            {featuredProblems.map((p) => {
              const isChecked = checked.includes(p.id)
              return (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-secondary/40"
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => toggleProblem(p.id)}
                    aria-label={`Mark ${p.title}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {p.code} · {p.platform}
                    </p>
                    <p
                      className={cn(
                        'truncate text-sm',
                        isChecked && 'text-muted-foreground line-through'
                      )}
                    >
                      {p.title}
                    </p>
                  </div>
                  <Badge variant={difficultyVariant(p.difficulty)}>
                    {p.difficulty}
                  </Badge>
                  <span className="w-12 text-right text-sm tabular-nums text-muted-foreground">
                    {p.rating}
                  </span>
                  <span
                    className={cn(
                      'w-20 text-right text-xs',
                      isChecked
                        ? 'text-success'
                        : p.status === 'attempted'
                          ? 'text-warning'
                          : 'text-muted-foreground'
                    )}
                  >
                    {isChecked
                      ? 'Solved'
                      : p.status === 'attempted'
                        ? 'Attempted'
                        : 'Todo'}
                  </span>
                </li>
              )
            })}
          </ul>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 text-xs',
                deadlineTone(featured.deadline)
              )}
            >
              <CalendarClock className="h-3.5 w-3.5" />
              {deadlineLabel(featured.deadline)} · {featured.assigned} students
              assigned
            </span>
            <Button size="sm" variant="contrast" asChild>
              <Link to="/app/problems">Solve next problem</Link>
            </Button>
          </div>
        </Card>

        {/* ------------------------------------------ Mentor assignments */}
        {canAuthor && (
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-medium">Assignments</h2>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/app/leaderboard">
                  All <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

            <ul className="mt-5 space-y-5">
              {roster.map((r) => (
                <li key={r.id}>
                  <div className="flex items-center gap-3">
                    <img
                      src={r.avatar}
                      alt=""
                      className="h-8 w-8 shrink-0 rounded-full bg-secondary"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{r.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {r.sheet}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {r.pct}%
                    </span>
                  </div>
                  <Progress value={r.pct} className="mt-2.5 h-1.5" />
                </li>
              ))}
            </ul>

            <Button
              variant="secondary"
              size="sm"
              className="mt-6 w-full"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4" /> Assign a new sheet
            </Button>
          </Card>
        )}
      </div>

      {/* -------------------------------------------------- Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a practice sheet</DialogTitle>
            <DialogDescription>
              Bundle problems into a sequenced set, then assign it to a cohort
              with a deadline.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="sheet-title">Title</Label>
              <Input
                id="sheet-title"
                placeholder="e.g. Tree DP — Regional Warmup"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sheet-desc">Description</Label>
              <Textarea
                id="sheet-desc"
                rows={3}
                placeholder="What should a student be able to do after finishing this sheet?"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Topic</Label>
                <Select defaultValue={TOPICS[0]}>
                  <SelectTrigger>
                    <SelectValue placeholder="Topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {TOPICS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Difficulty</Label>
                <Select defaultValue="Medium">
                  <SelectTrigger>
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="sheet-deadline">Deadline</Label>
                <Input id="sheet-deadline" type="date" defaultValue="2026-08-15" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sheet-assign">Assign to</Label>
                <Input id="sheet-assign" placeholder="Cohort or handles…" />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setCreateOpen(false)}>Create sheet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
