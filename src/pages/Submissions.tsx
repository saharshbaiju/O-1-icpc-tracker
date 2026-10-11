import { useState } from 'react'
import { Plus } from 'lucide-react'

import { Empty, Loaded, Pager, SqlPeek, VerdictBadge } from '@/components/bits'
import { PageHeader } from '@/components/layout/PageHeader'
import { SubmitDialog } from '@/components/SubmitDialog'
import { SyncButton } from '@/components/SyncButton'
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
import { useApi, VERDICTS, type SubmissionRow } from '@/lib/api'
import { useMe } from '@/lib/auth'
import { formatDateTime, VERDICT_SHORT } from '@/lib/format'
import { cn } from '@/lib/utils'

type Scope = 'me' | 'team' | 'all'

const SCOPES: { value: Scope; label: string }[] = [
  { value: 'me', label: 'Mine' },
  { value: 'team', label: 'My team' },
  { value: 'all', label: 'Everyone' },
]

const SQL = `
-- GET /api/submissions?scope=me  (backend/routes/submissions.py)
SELECT s.submitted_at, u.name, s.problem_code, p.title, s.language, s.verdict
FROM submission s
JOIN app_user u ON u.user_id = s.user_id
JOIN problem  p ON p.problem_code = s.problem_code
WHERE s.user_id = :me              -- scope=team: u.team_id = :my_team
  AND s.verdict = :verdict         -- only when a verdict is chosen
ORDER BY s.submitted_at DESC
LIMIT 500;

-- The primary key (user_id, problem_code, submitted_at) makes Submission
-- a weak entity, and lets the Codeforces sync skip rows it already has:
INSERT INTO submission (...) VALUES (...)
ON CONFLICT (user_id, problem_code, submitted_at) DO NOTHING;`

const PAGE_SIZE = 50

export default function Submissions() {
  const me = useMe()
  const [scope, setScope] = useState<Scope>('me')
  const [verdict, setVerdict] = useState('all')
  const [page, setPage] = useState(1)

  const path = `/submissions?scope=${scope}${verdict === 'all' ? '' : `&verdict=${verdict}`}`
  const state = useApi<SubmissionRow[]>(path)
  const rows = state.data ?? []
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const current = Math.min(page, pages)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Submissions"
        description="Every attempt, imported from Codeforces. One row per student, problem and moment."
        actions={
          // items-start: the sync status line under one button should not push the other one down.
          <div className="flex flex-wrap items-start gap-2">
            <SubmitDialog
              onSaved={state.reload}
              trigger={
                <Button size="pill" variant="outline">
                  <Plus /> Log by hand
                </Button>
              }
            />
            <SyncButton onDone={state.reload} />
          </div>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Whose submissions" className="inline-flex rounded-full border border-border bg-card p-1">
          {SCOPES.map((s) => (
            <button
              key={s.value}
              role="tab"
              aria-selected={scope === s.value}
              onClick={() => (setScope(s.value), setPage(1))}
              className={cn(
                'rounded-full px-4 py-1.5 text-xs transition-colors',
                scope === s.value ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <Select value={verdict} onValueChange={(v) => (setVerdict(v), setPage(1))}>
          <SelectTrigger className="h-9 sm:w-48" aria-label="Verdict">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any verdict</SelectItem>
            {VERDICTS.map((v) => (
              <SelectItem key={v} value={v}>
                {VERDICT_SHORT[v]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Old rows stay on screen while a new scope or verdict loads; dim them so that is visible. */}
      <Card className={cn('overflow-hidden transition-opacity', state.loading && 'opacity-60')}>
        <Loaded state={state}>
          {() =>
            rows.length === 0 ? (
              <div className="p-5">
                <Empty>
                  {scope === 'team' && me.team_id == null
                    ? 'You are not in a team.'
                    : verdict !== 'all'
                      ? 'No submissions with this verdict.'
                      : 'No submissions yet. Sync from Codeforces to import them.'}
                </Empty>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-36 pl-5">Submitted</TableHead>
                      {scope !== 'me' && <TableHead className="w-40">Student</TableHead>}
                      <TableHead>Problem</TableHead>
                      <TableHead className="w-40">Language</TableHead>
                      <TableHead className="w-36 pr-5">Verdict</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE).map((r) => (
                      <TableRow key={`${r.user_id}-${r.problem_code}-${r.submitted_at}`}>
                        <TableCell className="pl-5 text-xs tabular-nums text-muted-foreground">{formatDateTime(r.submitted_at)}</TableCell>
                        {scope !== 'me' && (
                          <TableCell className={cn('text-sm', r.user_id === me.user_id && 'font-medium')}>{r.name}</TableCell>
                        )}
                        <TableCell>
                          <span className="mr-2 font-mono text-xs text-muted-foreground">{r.problem_code}</span>
                          <span className="text-sm">{r.title}</span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {/* Truncate inside a block: a table cell itself just grows to fit nowrap text. */}
                          <span className="block max-w-40 truncate" title={r.language}>
                            {r.language}
                          </span>
                        </TableCell>
                        <TableCell className="pr-5">
                          <VerdictBadge verdict={r.verdict} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Pager page={current} pages={pages} onPage={setPage} />
                {rows.length === 500 && (
                  <p className="border-t border-border px-5 py-3 text-[11px] text-muted-foreground">Showing the latest 500.</p>
                )}
              </>
            )
          }
        </Loaded>
      </Card>

      <SqlPeek sql={SQL} />
    </div>
  )
}
