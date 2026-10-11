import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Plus, Search, Send } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

import { DifficultyBadge, Empty, ErrorNote, Loaded, Pager, SqlPeek, StatusIcon } from '@/components/bits'
import { PageHeader } from '@/components/layout/PageHeader'
import { SubmitDialog } from '@/components/SubmitDialog'
import { SyncButton } from '@/components/SyncButton'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { api, attempt, problemUrl, useApi, type ProblemRow } from '@/lib/api'

const SQL = `
-- GET /api/problems  (backend/routes/problems.py)
SELECT p.problem_code, p.title, p.rating, d.difficulty,
       array_agg(DISTINCT t.topic_name)  AS topics,
       CASE WHEN bool_or(s.verdict = 'OK') THEN 'solved'
            WHEN count(s.verdict) > 0     THEN 'attempted'
            ELSE 'todo' END                AS status
FROM problem p
JOIN v_problem_difficulty d ON d.problem_code = p.problem_code
LEFT JOIN problem_topic pt  ON pt.problem_code = p.problem_code
LEFT JOIN topic t           ON t.topic_id = pt.topic_id
LEFT JOIN submission s      ON s.problem_code = p.problem_code AND s.user_id = :me
GROUP BY p.problem_code, p.title, p.rating, d.difficulty
ORDER BY p.rating NULLS LAST, p.problem_code;`

const PAGE_SIZE = 50

export default function Problems() {
  const state = useApi<ProblemRow[]>('/problems')
  const [params] = useSearchParams()

  const urlQuery = params.get('q') ?? ''

  const [query, setQuery] = useState(urlQuery)
  const [topic, setTopic] = useState('all')
  const [difficulty, setDifficulty] = useState('all')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)

  // The top bar search navigates here with ?q=; follow it even when this page is already open.
  useEffect(() => {
    setQuery(urlQuery)
    setPage(1)
  }, [urlQuery])

  const all = state.data ?? []
  const topics = useMemo(() => [...new Set(all.flatMap((p) => p.topics))].sort(), [all])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return all.filter(
      (p) =>
        (!q || p.problem_code.toLowerCase().includes(q) || p.title.toLowerCase().includes(q)) &&
        (topic === 'all' || p.topics.includes(topic)) &&
        (difficulty === 'all' || p.difficulty === difficulty) &&
        (status === 'all' || p.status === status)
    )
  }, [all, query, topic, difficulty, status])

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const solved = all.filter((p) => p.status === 'solved').length

  function filter<T>(set: (v: T) => void) {
    return (v: T) => {
      set(v)
      setPage(1)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Problems"
        description={
          state.data
            ? `${all.length} problems in the database · you have solved ${solved}. Difficulty is derived from rating, never stored.`
            : 'Difficulty is derived from rating, never stored.'
        }
        actions={
          // items-start: the sync status line under one button should not push the other one down.
          <div className="flex flex-wrap items-start gap-2">
            <AddProblemDialog onAdded={state.reload} />
            <SyncButton variant="outline" onDone={state.reload} />
          </div>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => filter(setQuery)(e.target.value)}
            placeholder="Code or title"
            aria-label="Search problems"
            className="h-9 rounded-full pl-10"
          />
        </div>
        <div className="grid grid-cols-3 gap-2 lg:w-[480px]">
          <Select value={topic} onValueChange={filter(setTopic)}>
            <SelectTrigger className="h-9" aria-label="Topic">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">All topics</SelectItem>
              {topics.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={difficulty} onValueChange={filter(setDifficulty)}>
            <SelectTrigger className="h-9" aria-label="Difficulty">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any difficulty</SelectItem>
              <SelectItem value="Easy">Easy (&lt; 1400)</SelectItem>
              <SelectItem value="Medium">Medium (1400–1999)</SelectItem>
              <SelectItem value="Hard">Hard (2000+)</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={filter(setStatus)}>
            <SelectTrigger className="h-9" aria-label="Status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any status</SelectItem>
              <SelectItem value="solved">Solved</SelectItem>
              <SelectItem value="attempted">Attempted</SelectItem>
              <SelectItem value="todo">Not attempted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="overflow-hidden">
        <Loaded state={state}>
          {() =>
            rows.length === 0 ? (
              <div className="p-5">
                <Empty>
                  {all.length === 0
                    ? 'No problems yet. Sync your Codeforces submissions or add a problem.'
                    : 'No problem matches these filters.'}
                </Empty>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 pl-5">
                        <span className="sr-only">Status</span>
                      </TableHead>
                      <TableHead className="w-24">Code</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="w-20 text-right">Rating</TableHead>
                      <TableHead className="w-24">Difficulty</TableHead>
                      <TableHead className="w-24 pr-5 text-right">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visible.map((p) => (
                      <TableRow key={p.problem_code}>
                        <TableCell className="pl-5">
                          <StatusIcon status={p.status} />
                        </TableCell>
                        <TableCell className="font-mono text-xs">{p.problem_code}</TableCell>
                        <TableCell>
                          <p className="text-sm">{p.title}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">{p.topics.join(' · ') || '—'}</p>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{p.rating ?? '—'}</TableCell>
                        <TableCell>
                          <DifficultyBadge difficulty={p.difficulty} />
                        </TableCell>
                        <TableCell className="pr-5">
                          <div className="flex justify-end gap-1">
                            <SubmitDialog
                              problemCode={p.problem_code}
                              onSaved={state.reload}
                              trigger={
                                <Button variant="ghost" size="icon-sm" aria-label={`Log a submission for ${p.problem_code}`}>
                                  <Send />
                                </Button>
                              }
                            />
                            <Button variant="ghost" size="icon-sm" asChild>
                              <a href={problemUrl(p.problem_code)} target="_blank" rel="noreferrer" aria-label={`Open ${p.problem_code} on Codeforces`}>
                                <ArrowUpRight />
                              </a>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Pager page={current} pages={pages} onPage={setPage} />
              </>
            )
          }
        </Loaded>
      </Card>

      <SqlPeek sql={SQL} />
    </div>
  )
}

function AddProblemDialog({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [rating, setRating] = useState('')
  const [topics, setTopics] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function save() {
    setBusy(true)
    const err = await attempt(() =>
      api.post('/problems', {
        problem_code: code,
        title,
        rating: rating ? Number(rating) : null,
        topics: topics.split(','),
      })
    )
    setBusy(false)
    setError(err)
    if (!err) {
      setOpen(false)
      setCode('')
      setTitle('')
      setRating('')
      setTopics('')
      onAdded()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (setOpen(o), setError(null))}>
      <DialogTrigger asChild>
        <Button size="pill">
          <Plus /> Add problem
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add a problem</DialogTitle>
          <DialogDescription>
            One row in <code className="font-mono">problem</code>, plus one row in{' '}
            <code className="font-mono">problem_topic</code> per topic.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="code">Code</Label>
              <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="1520C" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rating">Rating (800–3500, optional)</Label>
            <Input id="rating" type="number" value={rating} onChange={(e) => setRating(e.target.value)} placeholder="1400" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="topics">Topics (comma separated)</Label>
            <Input id="topics" value={topics} onChange={(e) => setTopics(e.target.value)} placeholder="dp, greedy" />
          </div>
          <ErrorNote error={error} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy}>
            {busy ? 'Inserting…' : 'Insert'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
