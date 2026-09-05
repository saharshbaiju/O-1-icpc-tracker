import { useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Circle,
  CircleCheck,
  CircleDashed,
  Copy,
  Database,
  Filter,
  Lightbulb,
  Link2,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
  Shuffle,
  SlidersHorizontal,
  Target,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/StatCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
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
import { useAuth } from '@/lib/auth'
import {
  compact,
  DIFFICULTIES,
  difficultyVariant,
  PLATFORMS,
  problems,
  TOPICS,
} from '@/lib/data'
import type { Problem } from '@/lib/data'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 10

const STATUS_FILTERS = ['all', 'solved', 'attempted', 'todo'] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]

const STATUS_LABEL: Record<StatusFilter, string> = {
  all: 'All statuses',
  solved: 'Solved',
  attempted: 'Attempted',
  todo: 'Todo',
}

const STATUS_META = {
  solved: { icon: CircleCheck, tint: 'text-success', label: 'Solved' },
  attempted: { icon: CircleDashed, tint: 'text-warning', label: 'Attempted' },
  todo: { icon: Circle, tint: 'text-muted-foreground', label: 'Todo' },
} as const

type SortKey = 'rating' | 'acceptance'
type SortDir = 'asc' | 'desc'

function sortValue(p: Problem, key: SortKey) {
  return key === 'rating' ? p.rating : p.acceptance
}

const QUICK_TOPICS = TOPICS.slice(0, 10)

export default function Problems() {
  const { role } = useAuth()
  const canAuthor = role === 'mentor'

  const [query, setQuery] = useState('')
  const [platform, setPlatform] = useState('all')
  const [difficulty, setDifficulty] = useState('all')
  const [topic, setTopic] = useState('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [chips, setChips] = useState<string[]>([])
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)

  const totals = useMemo(() => {
    const solved = problems.filter((p) => p.status === 'solved').length
    const attempted = problems.filter((p) => p.status === 'attempted').length
    return {
      indexed: problems.length,
      solved,
      attempted,
      rate: Math.round((solved / problems.length) * 100),
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const rows = problems.filter((p) => {
      if (
        q &&
        !p.title.toLowerCase().includes(q) &&
        !p.code.toLowerCase().includes(q) &&
        !p.tags.some((t) => t.includes(q))
      )
        return false
      if (platform !== 'all' && p.platform !== platform) return false
      if (difficulty !== 'all' && p.difficulty !== difficulty) return false
      if (topic !== 'all' && !p.topics.includes(topic)) return false
      if (status !== 'all' && p.status !== status) return false
      if (chips.length && !chips.some((c) => p.topics.includes(c))) return false
      return true
    })

    if (sortKey) {
      rows.sort((a, b) => {
        const diff = sortValue(a, sortKey) - sortValue(b, sortKey)
        return sortDir === 'asc' ? diff : -diff
      })
    }
    return rows
  }, [query, platform, difficulty, topic, status, chips, sortKey, sortDir])

  const filtersActive =
    query !== '' ||
    platform !== 'all' ||
    difficulty !== 'all' ||
    topic !== 'all' ||
    status !== 'all' ||
    chips.length > 0

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * PAGE_SIZE
  const visible = filtered.slice(start, start + PAGE_SIZE)

  function resetFilters() {
    setQuery('')
    setPlatform('all')
    setDifficulty('all')
    setTopic('all')
    setStatus('all')
    setChips([])
    setPage(1)
  }

  function toggleChip(t: string) {
    setChips((prev) =>
      prev.includes(t) ? prev.filter((c) => c !== t) : [...prev, t]
    )
    setPage(1)
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
    setPage(1)
  }

  function pickRandom() {
    const pool = filtered.length ? filtered : problems
    const pick = pool[Math.floor(Math.random() * pool.length)]
    resetFilters()
    setQuery(pick.title)
  }

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) return <ArrowUpDown className="h-3 w-3 opacity-50" />
    return sortDir === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-primary" />
    ) : (
      <ArrowDown className="h-3 w-3 text-primary" />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Problem Repository"
        description="One unified index across Codeforces, CodeChef, LeetCode, AtCoder and more — tagged, rated, and cross-referenced with the editorials your mentors trust."
        actions={
          <>
            <Button variant="outline" size="pill" onClick={pickRandom}>
              <Shuffle className="h-4 w-4" /> Random problem
            </Button>
            {canAuthor && (
              <Button size="pill">
                <Plus className="h-4 w-4" /> Add problem
              </Button>
            )}
          </>
        }
      />

      {/* -------------------------------------------------- Stat row */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Problems indexed"
          value={totals.indexed}
          hint="Across six judges"
          icon="Database"
          accent="primary"
        />
        <StatCard
          label="Solved by you"
          value={totals.solved}
          delta={12}
          hint="Accepted at least once"
          icon="CircleCheck"
          accent="lime"
        />
        <StatCard
          label="Attempted"
          value={totals.attempted}
          delta={-4}
          hint="Submitted, not yet solved"
          icon="CircleDashed"
          accent="warning"
        />
        <StatCard
          label="Solve rate"
          value={`${totals.rate}%`}
          delta={6}
          hint="Of everything you opened"
          icon="Target"
          accent="chart-3"
        />
      </div>

      {/* -------------------------------------------------- Filter bar */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-medium">Filters</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {filtered.length} problem{filtered.length === 1 ? '' : 's'}
            </span>
            {filtersActive && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Clear filters
              </Button>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-12">
          <div className="relative lg:col-span-4">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
              placeholder="Search titles, codes or tags…"
              className="pl-10"
            />
          </div>

          <div className="lg:col-span-2">
            <Select
              value={platform}
              onValueChange={(v) => {
                setPlatform(v)
                setPage(1)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All platforms</SelectItem>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="lg:col-span-2">
            <Select
              value={difficulty}
              onValueChange={(v) => {
                setDifficulty(v)
                setPage(1)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All difficulties</SelectItem>
                {DIFFICULTIES.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="lg:col-span-2">
            <Select
              value={topic}
              onValueChange={(v) => {
                setTopic(v)
                setPage(1)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Topic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All topics</SelectItem>
                {TOPICS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="lg:col-span-2">
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v as StatusFilter)
                setPage(1)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Topic quick filters */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs text-muted-foreground">Quick topics</span>
          {QUICK_TOPICS.map((t) => {
            const on = chips.includes(t)
            return (
              <button
                key={t}
                onClick={() => toggleChip(t)}
                className={cn(
                  'rounded-full border border-border/70 px-3.5 py-1.5 text-xs transition-colors',
                  on
                    ? 'border-transparent bg-foreground font-medium text-background'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t}
              </button>
            )
          })}
        </div>
      </Card>

      {/* -------------------------------------------------- Table */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-medium">Index</h2>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            {chips.length > 0
              ? `${chips.length} topic filter${chips.length === 1 ? '' : 's'} applied`
              : 'No topic filter'}
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-muted-foreground">
              <Search className="h-6 w-6" />
            </span>
            <p className="text-sm font-medium">No problems match these filters</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Try widening the difficulty range or clearing the topic chips — the
              index holds {problems.length} problems in total.
            </p>
            <Button variant="secondary" size="sm" onClick={resetFilters}>
              Reset filters
            </Button>
          </div>
        ) : (
          <>
            <div className="mt-5">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead>Problem</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>
                      <button
                        onClick={() => toggleSort('rating')}
                        className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                      >
                        Rating <SortIcon column="rating" />
                      </button>
                    </TableHead>
                    <TableHead>Topics</TableHead>
                    <TableHead>
                      <button
                        onClick={() => toggleSort('acceptance')}
                        className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                      >
                        Acceptance <SortIcon column="acceptance" />
                      </button>
                    </TableHead>
                    <TableHead>Solved by</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((p) => {
                    const meta = STATUS_META[p.status]
                    const StatusIcon = meta.icon
                    return (
                      <TableRow
                        key={p.id}
                        className="transition-colors hover:bg-secondary/40"
                      >
                        <TableCell>
                          <StatusIcon
                            className={cn('h-4 w-4', meta.tint)}
                            aria-label={meta.label}
                          />
                        </TableCell>
                        <TableCell>
                          <p className="font-mono text-xs text-muted-foreground">
                            {p.code}
                          </p>
                          <p className="mt-0.5 whitespace-nowrap text-sm font-medium">
                            {p.title}
                          </p>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {p.platform}
                        </TableCell>
                        <TableCell>
                          <Badge variant={difficultyVariant(p.difficulty)}>
                            {p.difficulty}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm tabular-nums">
                          {p.rating}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1.5">
                            {p.topics.slice(0, 2).map((t) => (
                              <Badge key={t} variant="outline">
                                {t}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm tabular-nums text-muted-foreground">
                          {p.acceptance}%
                        </TableCell>
                        <TableCell className="text-sm tabular-nums text-muted-foreground">
                          {compact(p.solvedBy)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Actions for ${p.title}`}
                              >
                                <MoreHorizontal />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>{p.code}</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem disabled={!p.hasEditorial}>
                                <Target className="h-4 w-4" /> View editorial
                              </DropdownMenuItem>
                              <DropdownMenuItem disabled={p.hints === 0}>
                                <Lightbulb className="h-4 w-4" /> Show hints (
                                {p.hints})
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <MessageSquare className="h-4 w-4" /> Open
                                discussion ({p.discussions})
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Copy className="h-4 w-4" /> Copy link
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Link2 className="h-4 w-4" /> Open on {p.platform}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4">
              <p className="text-xs text-muted-foreground">
                Showing {start + 1}–
                {Math.min(start + PAGE_SIZE, filtered.length)} of{' '}
                {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Page {safePage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage <= 1}
                  onClick={() => setPage(safePage - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage(safePage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* -------------------------------------------------- Cross-link */}
      <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
            <Target className="h-[18px] w-[18px]" />
          </span>
          <div>
            <p className="text-sm font-medium">Prefer a guided path?</p>
            <p className="text-xs text-muted-foreground">
              Mentor-curated sheets sequence these same problems by topic.
            </p>
          </div>
        </div>
        <Button variant="secondary" size="pill" asChild>
          <Link to="/app/sheets">Browse practice sheets</Link>
        </Button>
      </Card>
    </div>
  )
}
