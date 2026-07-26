import { useMemo, useState } from 'react'
import {
  ArrowBigDown,
  ArrowBigUp,
  CircleCheck,
  MessageSquare,
  MessagesSquare,
  Plus,
  Search,
  Tags,
  TrendingUp,
} from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
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
import { Textarea } from '@/components/ui/textarea'
import { avatarFor, discussions, people, ROLE_LABEL } from '@/lib/data'
import { cn } from '@/lib/utils'

const SORTS = ['Latest', 'Top', 'Unanswered', 'Solved'] as const

const GUIDELINES = [
  'Post the failing test, not just “it does not work”.',
  'Mark an answer as accepted once it solves your problem.',
  'No full solutions to problems in a running contest.',
  'Editorials are welcome — tag them so they are easy to find.',
]

const REPLIES = [
  {
    id: 'rp-1',
    author: 'Aarav Mehta',
    role: 'mentor' as const,
    time: '1h ago',
    votes: 34,
    mentor: true,
    body: 'Your adjacency list is being rebuilt inside the loop, so you are paying O(m) on every relaxation. Hoist it out of the loop and the TLE disappears. Also prefer a priority_queue of pairs over a set here — the constant factor matters at n = 2·10^5.',
  },
  {
    id: 'rp-2',
    author: 'Meera Iyer',
    role: 'student' as const,
    time: '48m ago',
    votes: 12,
    mentor: false,
    body: 'Adding to that — if the graph is dense you might be better off with the O(n²) array version of Dijkstra. Heap Dijkstra is O(m log n), which loses when m ≈ n².',
  },
  {
    id: 'rp-3',
    author: 'Rohan Verma',
    role: 'student' as const,
    time: '20m ago',
    votes: 5,
    mentor: false,
    body: 'That was it, thank you both. Hoisting the adjacency build took it from 3.1s to 180ms.',
  },
]

export default function Discussions() {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<(typeof SORTS)[number]>('Latest')
  const [tag, setTag] = useState('all')
  const [composeOpen, setComposeOpen] = useState(false)
  const [votes, setVotes] = useState<Record<string, number>>({})
  const [reply, setReply] = useState('')

  const allTags = useMemo(
    () => [...new Set(discussions.flatMap((d) => d.tags))].sort(),
    []
  )

  const tagCounts = useMemo(
    () =>
      allTags
        .map((t) => ({
          tag: t,
          count: discussions.filter((d) => d.tags.includes(t)).length,
        }))
        .sort((a, b) => b.count - a.count),
    [allTags]
  )

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    let rows = discussions.filter((d) => {
      if (q && !d.title.toLowerCase().includes(q) && !d.excerpt.toLowerCase().includes(q))
        return false
      if (tag !== 'all' && !d.tags.includes(tag)) return false
      if (sort === 'Unanswered' && d.replies > 0) return false
      if (sort === 'Solved' && !d.solved) return false
      return true
    })
    if (sort === 'Top') rows = [...rows].sort((a, b) => b.votes - a.votes)
    return rows
  }, [query, sort, tag])

  const featured = discussions[0]

  function vote(id: string, dir: 1 | -1) {
    setVotes((prev) => ({ ...prev, [id]: prev[id] === dir ? 0 : dir }))
  }

  const contributors = people.slice(0, 5).map((p, i) => ({
    ...p,
    answers: 148 - i * 23,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Discussions"
        description="Ask about a stuck submission, compare approaches, and get feedback from mentors who have coached regional teams."
        actions={
          <Button size="pill" onClick={() => setComposeOpen(true)}>
            <Plus className="h-4 w-4" /> New discussion
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="space-y-5">
          {/* -------------------------------------------- Filters */}
          <Card className="p-5">
            <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search discussions…"
                  className="pl-10"
                />
              </div>
              <Select value={tag} onValueChange={setTag}>
                <SelectTrigger>
                  <SelectValue placeholder="Tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tags</SelectItem>
                  {allTags.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {SORTS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSort(s)}
                    className={cn(
                      'rounded-full border border-border/70 px-4 py-1.5 text-xs transition-colors',
                      sort === s
                        ? 'border-transparent bg-foreground font-medium text-background'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {list.length} thread{list.length === 1 ? '' : 's'}
              </span>
            </div>
          </Card>

          {/* -------------------------------------------- Threads */}
          {list.length === 0 ? (
            <Card className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-muted-foreground">
                <MessagesSquare className="h-6 w-6" />
              </span>
              <p className="text-sm font-medium">No threads match that filter</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setQuery('')
                  setSort('Latest')
                  setTag('all')
                }}
              >
                Reset
              </Button>
            </Card>
          ) : (
            list.map((d) => {
              const v = votes[d.id] ?? 0
              return (
                <Card
                  key={d.id}
                  className="flex gap-4 p-5 transition-colors hover:border-primary/30 hover:bg-secondary/20"
                >
                  <div className="flex w-10 shrink-0 flex-col items-center gap-0.5">
                    <button
                      onClick={() => vote(d.id, 1)}
                      aria-label="Upvote"
                      className={cn(
                        'rounded-lg p-1 transition-colors hover:bg-secondary',
                        v === 1 ? 'text-primary' : 'text-muted-foreground'
                      )}
                    >
                      <ArrowBigUp
                        className={cn('h-5 w-5', v === 1 && 'fill-current')}
                      />
                    </button>
                    <span className="text-sm font-medium tabular-nums">
                      {d.votes + v}
                    </span>
                    <button
                      onClick={() => vote(d.id, -1)}
                      aria-label="Downvote"
                      className={cn(
                        'rounded-lg p-1 transition-colors hover:bg-secondary',
                        v === -1 ? 'text-destructive' : 'text-muted-foreground'
                      )}
                    >
                      <ArrowBigDown
                        className={cn('h-5 w-5', v === -1 && 'fill-current')}
                      />
                    </button>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="cursor-pointer text-base font-medium leading-snug tracking-tight transition-colors hover:text-primary">
                        {d.title}
                      </h3>
                      {d.solved && (
                        <Badge variant="success">
                          <CircleCheck className="h-3 w-3" /> Solved
                        </Badge>
                      )}
                    </div>

                    <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                      {d.excerpt}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {d.tags.map((t) => (
                        <Badge key={t} variant="outline">
                          {t}
                        </Badge>
                      ))}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <img
                          src={d.authorAvatar}
                          alt=""
                          className="h-5 w-5 rounded-full bg-secondary"
                        />
                        {d.author}
                      </span>
                      <Badge variant="secondary">{ROLE_LABEL[d.role]}</Badge>
                      <span className="inline-flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5" /> {d.replies}
                      </span>
                      <span>{d.createdAt}</span>
                    </div>
                  </div>
                </Card>
              )
            })
          )}

          {/* -------------------------------------------- Expanded thread */}
          <Card className="p-6">
            <div className="flex items-center gap-2">
              <MessagesSquare className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-medium">Thread preview</h2>
            </div>

            <h3 className="mt-4 text-xl font-medium leading-snug tracking-tight">
              {featured.title}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <img
                  src={featured.authorAvatar}
                  alt=""
                  className="h-5 w-5 rounded-full bg-secondary"
                />
                {featured.author}
              </span>
              <span>{featured.createdAt}</span>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {featured.excerpt} I am storing the graph as a vector of vectors and
              running a priority_queue-based Dijkstra. On sparse tests it finishes
              in 200ms, but the dense generator pushes it past the 3-second limit
              every time. Full code is in the paste below.
            </p>

            <div className="mt-6 space-y-4 border-t border-border/50 pt-6">
              {REPLIES.map((r) => (
                <div
                  key={r.id}
                  className={cn(
                    'rounded-2xl border p-5',
                    r.mentor
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-border/60 bg-secondary/20'
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <img
                      src={avatarFor(r.author)}
                      alt=""
                      className="h-7 w-7 rounded-full bg-secondary"
                    />
                    <span className="text-sm font-medium">{r.author}</span>
                    <Badge variant={r.mentor ? 'default' : 'secondary'}>
                      {r.mentor ? 'Mentor answer' : ROLE_LABEL[r.role]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{r.time}</span>
                    <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <ArrowBigUp className="h-4 w-4" /> {r.votes}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {r.body}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-border/50 pt-5">
              <Label htmlFor="reply">Your reply</Label>
              <Textarea
                id="reply"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={3}
                placeholder="Share what worked, and why…"
                className="mt-2"
              />
              <div className="mt-3 flex justify-end">
                <Button size="sm" disabled={!reply.trim()} onClick={() => setReply('')}>
                  Post reply
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* ---------------------------------------------- Sidebar */}
        <div className="space-y-5">
          <Card className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-medium">Top contributors</h2>
            </div>
            <ul className="mt-5 divide-y divide-border/50">
              {contributors.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-2.5 first:pt-0">
                  <img
                    src={p.avatar}
                    alt=""
                    className="h-8 w-8 shrink-0 rounded-full bg-secondary"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{p.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {ROLE_LABEL[p.role]}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {p.answers}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2">
              <Tags className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-medium">Popular tags</h2>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {tagCounts.map((t) => (
                <button
                  key={t.tag}
                  onClick={() => setTag(t.tag)}
                  className={cn(
                    'rounded-full border border-border/70 px-3 py-1.5 text-xs transition-colors',
                    tag === t.tag
                      ? 'border-transparent bg-foreground font-medium text-background'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {t.tag} · {t.count}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-sm font-medium">Community guidelines</h2>
            <ul className="mt-4 space-y-2.5">
              {GUIDELINES.map((g) => (
                <li
                  key={g}
                  className="flex items-start gap-2.5 text-xs leading-relaxed text-muted-foreground"
                >
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  {g}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {/* -------------------------------------------------- Compose */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start a discussion</DialogTitle>
            <DialogDescription>
              Include the problem, what you tried, and where it broke.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="d-title">Title</Label>
              <Input id="d-title" placeholder="Why does my Dijkstra TLE…" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="d-body">Body</Label>
              <Textarea id="d-body" rows={5} placeholder="Describe the problem…" />
            </div>
            <div className="grid gap-2">
              <Label>Tag</Label>
              <Select defaultValue={allTags[0]}>
                <SelectTrigger>
                  <SelectValue placeholder="Tag" />
                </SelectTrigger>
                <SelectContent>
                  {allTags.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-secondary/40 px-4 py-3">
              <div>
                <p className="text-sm">Post anonymously</p>
                <p className="text-xs text-muted-foreground">
                  Your handle will be hidden from other students.
                </p>
              </div>
              <Switch />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setComposeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setComposeOpen(false)}>Post discussion</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
