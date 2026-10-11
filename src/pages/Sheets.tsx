import { useState } from 'react'
import { ArrowUpRight, PanelRight, Play, Plus, Trash2, X } from 'lucide-react'
import { Link } from 'react-router-dom'

import { DifficultyBadge, Empty, ErrorNote, Initials, Loaded, SqlPeek, StatusIcon } from '@/components/bits'
import { PageHeader } from '@/components/layout/PageHeader'
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
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api, attempt, openBeside, problemUrl, useApi, type CfProblem, type SheetDetail, type SheetSummary } from '@/lib/api'
import { useMe } from '@/lib/auth'
import { deadlineLabel, formatDate } from '@/lib/format'
import { useDebounced } from '@/lib/useDebounced'
import { cn } from '@/lib/utils'

const SQL = `
-- v_sheet_progress: for each member of the sheet's team, solved / total
SELECT sh.sheet_id, u.user_id, u.name,
       count(sp.problem_code) AS total,
       count(sp.problem_code) FILTER (WHERE EXISTS (
         SELECT 1 FROM submission s
         WHERE s.user_id = u.user_id AND s.problem_code = sp.problem_code
           AND s.verdict = 'OK')) AS solved
FROM sheet sh
JOIN app_user u       ON u.team_id = sh.team_id
JOIN sheet_problem sp ON sp.sheet_id = sh.sheet_id
GROUP BY sh.sheet_id, u.user_id, u.name;

-- Creating a sheet = 1 row in sheet + 1 row per problem in sheet_problem,
-- all in one transaction (backend/routes/sheets.py).`

export default function Sheets() {
  const me = useMe()
  const list = useApi<SheetSummary[]>(me.team_id ? '/sheets' : null)
  const [selected, setSelected] = useState<number | null>(null)

  if (!me.team_id) {
    return (
      <div className="space-y-5">
        <PageHeader title="Sheets" description="Practice lists shared by a team." />
        <Empty>
          Sheets belong to a team.{' '}
          <Link to="/app/team" className="text-foreground underline underline-offset-2">
            Join or create a team
          </Link>{' '}
          first.
        </Empty>
      </div>
    )
  }

  const sheets = list.data ?? []
  const current = sheets.find((s) => s.sheet_id === selected) ?? sheets[0]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Sheets"
        description={`Ordered practice lists for ${me.team_name}. Progress comes straight from submissions.`}
        actions={
          <NewSheetDialog
            onCreated={(id) => {
              setSelected(id)
              list.reload()
            }}
          />
        }
      />

      <Loaded state={list}>
        {() =>
          sheets.length === 0 ? (
            <Empty>Your team has no sheets yet. Create the first one.</Empty>
          ) : (
            <div className="grid gap-5 lg:grid-cols-12">
              <ul className="space-y-2 lg:col-span-4">
                {sheets.map((s) => {
                  const active = current?.sheet_id === s.sheet_id
                  return (
                    <li key={s.sheet_id}>
                      <button
                        onClick={() => setSelected(s.sheet_id)}
                        aria-current={active}
                        className={cn(
                          'w-full rounded-xl border bg-card p-4 text-left transition-colors',
                          active ? 'border-foreground' : 'border-border hover:bg-secondary/60'
                        )}
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="truncate text-sm font-medium">{s.title}</p>
                          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                            {s.solved}/{s.total}
                          </span>
                        </div>
                        <Progress value={s.total ? (100 * s.solved) / s.total : 0} className="mt-3 h-1.5" />
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          {s.deadline ? `${formatDate(s.deadline)} · ` : ''}
                          {s.total > 0 && s.solved === s.total ? 'You finished this' : deadlineLabel(s.deadline)}
                        </p>
                      </button>
                    </li>
                  )
                })}
              </ul>

              {current && (
                <SheetPanel
                  key={current.sheet_id}
                  sheetId={current.sheet_id}
                  onDeleted={() => {
                    setSelected(null)
                    list.reload()
                  }}
                />
              )}
            </div>
          )
        }
      </Loaded>

      <SqlPeek sql={SQL} />
    </div>
  )
}

function SheetPanel({ sheetId, onDeleted }: { sheetId: number; onDeleted: () => void }) {
  const me = useMe()
  const state = useApi<SheetDetail>(`/sheets/${sheetId}`)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function deleteSheet(sheet: SheetDetail) {
    if (!window.confirm(`Delete “${sheet.title}”? Its problem list is deleted with it.`)) return
    setDeleting(true)
    const err = await attempt(() => api.del(`/sheets/${sheet.sheet_id}`))
    setDeleting(false)
    setDeleteError(err)
    if (!err) onDeleted()
  }

  return (
    <Card className="overflow-hidden lg:col-span-8">
      <Loaded state={state}>
        {(sheet) => {
          const status = new Map(sheet.attempts.map((a) => [`${a.user_id}:${a.problem_code}`, a.status]))
          const nextForMe = sheet.problems.find((p) => status.get(`${me.user_id}:${p.problem_code}`) !== 'solved')
          return (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border p-5">
                <div className="min-w-0">
                  <h2 className="break-words text-lg font-medium">{sheet.title}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {sheet.deadline ? `Due ${formatDate(sheet.deadline)} · ${deadlineLabel(sheet.deadline)}` : 'No deadline'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {nextForMe && (
                    <Button size="sm" onClick={() => openBeside(problemUrl(nextForMe.problem_code))} title="Opens Codeforces in a window beside this one">
                      <Play className="h-3.5 w-3.5" /> Practise next: {nextForMe.problem_code}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete sheet"
                    title="Delete sheet (cascades to sheet_problem)"
                    disabled={deleting}
                    onClick={() => deleteSheet(sheet)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
              {deleteError && (
                <div className="border-b border-border p-5">
                  <ErrorNote error={deleteError} />
                </div>
              )}

              <div className="scroll-slim overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="w-10 py-3 pl-5 text-[11px] font-normal text-muted-foreground">#</th>
                      <th className="py-3 text-[11px] font-normal text-muted-foreground">Problem</th>
                      <th className="w-24 py-3 text-[11px] font-normal text-muted-foreground">Difficulty</th>
                      {sheet.members.map((m) => (
                        <th key={m.user_id} className="w-14 py-3 text-center font-normal">
                          <span title={m.name} className="inline-flex">
                            <Initials name={m.name} className={cn('h-7 w-7 text-[10px]', m.user_id === me.user_id && 'border-foreground')} />
                          </span>
                        </th>
                      ))}
                      <th className="w-20 pr-5" />
                    </tr>
                  </thead>
                  <tbody>
                    {sheet.problems.map((p) => (
                      <tr key={p.problem_code} className="border-b border-border last:border-0">
                        <td className="py-3 pl-5 text-xs tabular-nums text-muted-foreground">{p.position}</td>
                        <td className="py-3">
                          <span className="mr-2 font-mono text-xs text-muted-foreground">{p.problem_code}</span>
                          <a href={problemUrl(p.problem_code)} target="_blank" rel="noreferrer" className="hover:underline">
                            {p.title}
                          </a>
                        </td>
                        <td className="py-3">
                          <DifficultyBadge difficulty={p.difficulty} />
                        </td>
                        {sheet.members.map((m) => (
                          <td key={m.user_id} className="py-3">
                            <span className="flex justify-center">
                              <StatusIcon status={status.get(`${m.user_id}:${p.problem_code}`) ?? 'todo'} />
                            </span>
                          </td>
                        ))}
                        <td className="whitespace-nowrap py-3 pr-5 text-right">
                          <button
                            onClick={() => openBeside(problemUrl(p.problem_code))}
                            aria-label={`Open ${p.problem_code} beside this window`}
                            title="Open beside"
                            className="inline-grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                          >
                            <PanelRight className="h-4 w-4" />
                          </button>
                          <a
                            href={problemUrl(p.problem_code)}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Open ${p.problem_code} on Codeforces`}
                            className="inline-grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border bg-secondary/50">
                      <td />
                      <td className="py-3 text-[11px] text-muted-foreground" colSpan={2}>
                        Solved
                      </td>
                      {sheet.members.map((m) => (
                        <td key={m.user_id} className="py-3 text-center text-xs font-medium tabular-nums">
                          {m.solved}/{m.total}
                        </td>
                      ))}
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )
        }}
      </Loaded>
    </Card>
  )
}

const RATING_RANGES: Record<string, [number, number] | null> = {
  any: null,
  '800-1200': [800, 1200],
  '1300-1600': [1300, 1600],
  '1700-2000': [1700, 2000],
  '2100-2400': [2100, 2400],
  '2500-3500': [2500, 3500],
}

function NewSheetDialog({ onCreated }: { onCreated: (id: number) => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [deadline, setDeadline] = useState('')
  const [picked, setPicked] = useState<CfProblem[]>([])
  const [text, setText] = useState('')
  const [tag, setTag] = useState('any')
  const [range, setRange] = useState('any')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Search all of Codeforces (GET /api/codeforces/problems), 300 ms after typing stops.
  const query = useDebounced(text.trim())
  const params = new URLSearchParams({ q: query })
  if (tag !== 'any') params.set('tag', tag)
  if (RATING_RANGES[range]) {
    params.set('min_rating', String(RATING_RANGES[range]![0]))
    params.set('max_rating', String(RATING_RANGES[range]![1]))
  }
  const results = useApi<CfProblem[]>(open ? `/codeforces/problems?${params}` : null)
  const tags = useApi<string[]>(open ? '/codeforces/tags' : null)
  const shown = (results.data ?? []).filter((p) => !picked.some((x) => x.problem_code === p.problem_code))

  async function save() {
    setBusy(true)
    let id = 0
    const err = await attempt(async () => {
      const r = await api.post<{ sheet_id: number }>('/sheets', {
        title,
        deadline: deadline || null,
        problem_codes: picked.map((p) => p.problem_code),
      })
      id = r.sheet_id
    })
    setBusy(false)
    setError(err)
    if (!err) {
      setOpen(false)
      setTitle('')
      setDeadline('')
      setPicked([])
      setText('')
      setTag('any')
      setRange('any')
      onCreated(id)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (setOpen(o), setError(null))}>
      <DialogTrigger asChild>
        <Button size="pill">
          <Plus /> New sheet
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New team sheet</DialogTitle>
          <DialogDescription>
            Search any Codeforces problem. The whole team sees the sheet and practises the same set.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Stacked on phones: a date input needs more room than a third of the dialog. */}
          <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="space-y-1.5">
              <Label htmlFor="sheet-title">Title</Label>
              <Input id="sheet-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Graphs week 2" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sheet-deadline">Deadline</Label>
              <Input id="sheet-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>

          {picked.length > 0 && (
            <ol className="scroll-slim max-h-36 space-y-1 overflow-y-auto">
              {picked.map((p, i) => (
                <li key={p.problem_code} className="flex items-center gap-3 rounded-lg bg-secondary px-3 py-1.5 text-xs">
                  <span className="w-4 tabular-nums text-muted-foreground">{i + 1}</span>
                  <span className="w-16 font-mono">{p.problem_code}</span>
                  <span className="flex-1 truncate">{p.title}</span>
                  <span className="tabular-nums text-muted-foreground">{p.rating ?? ''}</span>
                  <button
                    aria-label={`Remove ${p.problem_code}`}
                    onClick={() => setPicked((cur) => cur.filter((x) => x.problem_code !== p.problem_code))}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ol>
          )}

          <div className="space-y-2">
            <Label htmlFor="sheet-search">Search Codeforces</Label>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
              <Input id="sheet-search" value={text} onChange={(e) => setText(e.target.value)} placeholder="Title, or code like 455A / 1520" />
              <Select value={tag} onValueChange={setTag}>
                <SelectTrigger aria-label="Tag">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="any">Any tag</SelectItem>
                  {(tags.data ?? []).map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={range} onValueChange={setRange}>
                <SelectTrigger aria-label="Rating">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(RATING_RANGES).map((r) => (
                    <SelectItem key={r} value={r}>
                      {r === 'any' ? 'Any rating' : r.replace('-', '–')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ul className="scroll-slim max-h-64 divide-y divide-border overflow-y-auto rounded-lg border border-border">
              {results.error ? (
                <li className="px-3 py-4 text-center text-xs">{results.error}</li>
              ) : results.data === null || results.loading ? (
                <li className="px-3 py-4 text-center text-xs text-muted-foreground">
                  {results.data === null ? 'Loading the Codeforces problemset… (a few seconds the first time)' : 'Searching…'}
                </li>
              ) : shown.length === 0 ? (
                <li className="px-3 py-4 text-center text-xs text-muted-foreground">No problems match.</li>
              ) : (
                shown.map((p) => (
                  <li key={p.problem_code} className="flex items-center gap-3 px-3 py-2 text-xs">
                    <button
                      type="button"
                      aria-label={`Add ${p.problem_code} to the sheet`}
                      onClick={() => setPicked((cur) => [...cur, p])}
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-border hover:bg-foreground hover:text-background"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-14 shrink-0 font-mono text-muted-foreground">{p.problem_code}</span>
                    <div className="min-w-0 flex-1">
                      <a href={problemUrl(p.problem_code)} target="_blank" rel="noreferrer" className="block truncate hover:underline">
                        {p.title}
                      </a>
                      <p className="truncate text-[10px] text-muted-foreground">{p.tags.join(' · ') || 'no tags'}</p>
                    </div>
                    <span className="w-10 shrink-0 text-right tabular-nums">{p.rating ?? '—'}</span>
                    <span className="hidden w-16 shrink-0 text-right tabular-nums text-muted-foreground sm:block" title="Solved on Codeforces">
                      ×{p.solved_count.toLocaleString()}
                    </span>
                  </li>
                ))
              )}
            </ul>
            <p className="text-[10px] text-muted-foreground">Newest first · ×N = people who solved it on Codeforces · first 50 matches</p>
          </div>
          <ErrorNote error={error} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={picked.length === 0 || busy}>
            {busy ? 'Creating…' : `Create sheet (${picked.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
