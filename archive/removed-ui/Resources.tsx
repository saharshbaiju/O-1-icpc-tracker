import { useMemo, useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  Eye,
  FileText,
  GraduationCap,
  Map,
  Plus,
  Search,
  StickyNote,
  Video,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  compact,
  difficultyVariant,
  resources,
  topicMastery,
  TOPICS,
} from '@/lib/data'
import type { Resource } from '@/lib/data'
import { cn } from '@/lib/utils'

const TYPES = [
  'All',
  'Article',
  'Video',
  'Notes',
  'Roadmap',
  'Tutorial',
  'Book',
] as const

const TYPE_META: Record<
  Resource['type'],
  { icon: typeof FileText; tile: string }
> = {
  Article: { icon: FileText, tile: 'border border-border bg-card text-foreground' },
  Video: { icon: Video, tile: 'bg-foreground text-background' },
  Notes: { icon: StickyNote, tile: 'border border-border bg-secondary text-foreground' },
  Roadmap: { icon: Map, tile: 'bg-primary text-primary-foreground' },
  Tutorial: { icon: GraduationCap, tile: 'border border-border bg-card text-foreground' },
  Book: { icon: BookOpen, tile: 'bg-foreground text-background' },
}

/** Where you left off in longer-form material. */
const IN_PROGRESS = [
  { id: 'r-02', title: 'The Complete DP Roadmap', meta: 'Week 5 of 12', pct: 42 },
  { id: 'r-04', title: 'Segment Trees from First Principles', meta: '14 of 22 min', pct: 64 },
  { id: 'r-07', title: 'Max Flow / Min Cut Explained', meta: '9 of 54 min', pct: 17 },
]

export default function Resources() {
  const [query, setQuery] = useState('')
  const [type, setType] = useState<(typeof TYPES)[number]>('All')
  const [topic, setTopic] = useState('all')
  const [saved, setSaved] = useState<string[]>(() =>
    resources.filter((r) => r.bookmarked).map((r) => r.id)
  )

  const featured = resources.find((r) => r.type === 'Roadmap') ?? resources[0]

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return resources.filter((r) => {
      if (q && !r.title.toLowerCase().includes(q) && !r.author.toLowerCase().includes(q))
        return false
      if (type !== 'All' && r.type !== type) return false
      if (topic !== 'all' && r.topic !== topic) return false
      return true
    })
  }, [query, type, topic])

  function toggleSave(id: string) {
    setSaved((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const paths = useMemo(
    () =>
      topicMastery.slice(0, 6).map((t) => ({
        topic: t.topic,
        mastery: t.mastery,
        count: resources.filter((r) => r.topic === t.topic).length || 2,
      })),
    []
  )

  const topicOptions = useMemo(
    () => TOPICS.filter((t) => resources.some((r) => r.topic === t)),
    []
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Learning Resources"
        description="Curated articles, videos, notes, roadmaps and tutorials — organised by topic and difficulty, and vetted by the mentors who coach regional teams."
        actions={
          <Button size="pill">
            <Plus className="h-4 w-4" /> Submit a resource
          </Button>
        }
      />

      {/* -------------------------------------------------- Featured */}
      <Card className="relative overflow-hidden p-8 sm:p-10">
        <div className="relative max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">{featured.type}</Badge>
            <Badge variant="outline">{featured.topic}</Badge>
            <Badge variant={difficultyVariant(featured.level)}>
              {featured.level}
            </Badge>
          </div>

          <h2
            className="font-display mt-5 text-3xl sm:text-4xl"
          >
            {featured.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            A twelve-week sequence that takes you from one-dimensional knapsack
            through tree DP, bitmask states and digit DP — with a checkpoint
            problem set at the end of every week.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span>{featured.author}</span>
            <span>{featured.duration}</span>
            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" /> {compact(featured.views)} views
            </span>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="contrast" size="pill">
              Start roadmap <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="pill"
              onClick={() => toggleSave(featured.id)}
            >
              <Bookmark
                className={cn(
                  'h-4 w-4',
                  saved.includes(featured.id) && 'fill-current text-foreground'
                )}
              />
              {saved.includes(featured.id) ? 'Saved' : 'Save for later'}
            </Button>
          </div>
        </div>
      </Card>

      {/* -------------------------------------------------- Filters */}
      <Card className="p-5">
        <div className="grid gap-3 lg:grid-cols-12">
          <div className="relative lg:col-span-5">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search resources or authors…"
              className="pl-10"
            />
          </div>
          <div className="lg:col-span-3">
            <Select value={topic} onValueChange={setTopic}>
              <SelectTrigger>
                <SelectValue placeholder="Topic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All topics</SelectItem>
                {topicOptions.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-end text-xs text-muted-foreground lg:col-span-4">
            {filtered.length} resource{filtered.length === 1 ? '' : 's'} ·{' '}
            {saved.length} saved
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={cn(
                'rounded-full px-4 py-1.5 text-xs transition-colors',
                type === t
                  ? 'border-transparent bg-foreground font-medium text-background'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </Card>

      {/* -------------------------------------------------- Grid */}
      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-20 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-lg border border-border bg-secondary text-muted-foreground">
            <Search className="h-6 w-6" />
          </span>
          <p className="text-sm font-medium">Nothing matches that search</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setQuery('')
              setType('All')
              setTopic('all')
            }}
          >
            Reset filters
          </Button>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => {
            const meta = TYPE_META[r.type]
            const Icon = meta.icon
            const isSaved = saved.includes(r.id)
            return (
              <Card
                key={r.id}
                className="flex flex-col p-6 transition-colors hover:bg-secondary"
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={cn(
                      'grid h-10 w-10 shrink-0 place-items-center rounded-lg',
                      meta.tile
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <button
                    onClick={() => toggleSave(r.id)}
                    aria-label={isSaved ? 'Remove bookmark' : 'Bookmark'}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <Bookmark
                      className={cn(
                        'h-4 w-4',
                        isSaved && 'fill-current text-foreground'
                      )}
                    />
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{r.type}</Badge>
                  <Badge variant={difficultyVariant(r.level)}>{r.level}</Badge>
                </div>

                <h3 className="mt-3 text-base font-medium leading-snug tracking-tight">
                  {r.title}
                </h3>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {r.author} · {r.topic}
                </p>

                <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-xs text-muted-foreground">
                  <span>{r.duration}</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" /> {compact(r.views)}
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* -------------------------------------------------- Paths + continue */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center gap-2">
            <Map className="h-4 w-4 text-foreground" />
            <h2 className="paper-label text-muted-foreground">Learning paths by topic</h2>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Your coverage of the curated material for each area.
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {paths.map((p) => (
              <div key={p.topic}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="truncate text-sm">{p.topic}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {p.count} resource{p.count === 1 ? '' : 's'}
                  </span>
                </div>
                <Progress
                  value={p.mastery}
                  className="mt-2.5 h-1.5"
                  indicatorClassName="bg-foreground"
                />
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  {p.mastery}% covered
                </p>
              </div>
            ))}
          </div>

          <Button variant="secondary" size="sm" className="mt-6" asChild>
            <Link to="/app/analytics">See full topic breakdown</Link>
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-foreground" />
            <h2 className="paper-label text-muted-foreground">Continue where you left off</h2>
          </div>

          <ul className="mt-6 space-y-5">
            {IN_PROGRESS.map((item) => (
              <li key={item.id}>
                <p className="truncate text-sm">{item.title}</p>
                <Progress value={item.pct} className="mt-2.5 h-1.5" />
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{item.meta}</span>
                  <span>{item.pct}%</span>
                </div>
              </li>
            ))}
          </ul>

          <Button variant="contrast" size="sm" className="mt-6 w-full">
            Resume last session
          </Button>
        </Card>
      </div>
    </div>
  )
}
