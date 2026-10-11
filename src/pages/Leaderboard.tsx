import { useState } from 'react'

import { Empty, Initials, Loaded, SqlPeek } from '@/components/bits'
import { PageHeader } from '@/components/layout/PageHeader'
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
import { useApi, type LeaderRow, type University } from '@/lib/api'
import { useMe } from '@/lib/auth'
import { cn } from '@/lib/utils'

const SQL = `
-- v_leaderboard: distinct problems solved per user
CREATE VIEW v_leaderboard AS
SELECT u.user_id, u.name, un.univ_name,
       count(DISTINCT s.problem_code) AS solved
FROM app_user u
JOIN university un     ON un.univ_id = u.univ_id
LEFT JOIN submission s ON s.user_id = u.user_id AND s.verdict = 'OK'
GROUP BY u.user_id, u.name, un.univ_name;

-- GET /api/leaderboard: ranked with a window function; ties share a rank
SELECT rank() OVER (ORDER BY lb.solved DESC) AS rank,
       lb.name, lb.univ_name, t.team_name, lb.solved
FROM v_leaderboard lb
JOIN app_user u  ON u.user_id = lb.user_id
LEFT JOIN team t ON t.team_id = u.team_id
WHERE :univ_id IS NULL OR u.univ_id = :univ_id;`

export default function Leaderboard() {
  const me = useMe()
  const [univ, setUniv] = useState('all')
  const universities = useApi<University[]>('/universities').data ?? []
  const state = useApi<LeaderRow[]>(univ === 'all' ? '/leaderboard' : `/leaderboard?univ_id=${univ}`)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Leaderboard"
        description="Ranked by distinct problems solved. Computed by a view, so it is always up to date."
        actions={
          <Select value={univ} onValueChange={setUniv}>
            <SelectTrigger className="h-9 w-64" aria-label="University">
              <SelectValue className="truncate" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All universities</SelectItem>
              {universities.map((u) => (
                <SelectItem key={u.univ_id} value={String(u.univ_id)}>
                  {u.univ_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <Loaded state={state}>
        {(rows) => (rows.length === 0 ? <Empty>No students yet.</Empty> : <Board rows={rows} meId={me.user_id} />)}
      </Loaded>

      <SqlPeek sql={SQL} />
    </div>
  )
}

function Board({ rows, meId }: { rows: LeaderRow[]; meId: number }) {
  const top = Math.max(1, rows[0].solved)

  return (
    <>
      <ol className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
        {rows.slice(0, 3).map((r) => (
          <li key={r.user_id} className={cn('bg-card p-5', r.rank === 1 && 'bg-foreground text-background')}>
            <p className={cn('paper-label', r.rank === 1 ? 'opacity-60' : 'text-muted-foreground')}>Rank {r.rank}</p>
            <p className="font-display mt-6 text-5xl tabular-nums">{r.solved}</p>
            <p className="mt-3 truncate text-sm font-medium">{r.name}</p>
            <p className={cn('truncate text-[11px]', r.rank === 1 ? 'opacity-60' : 'text-muted-foreground')}>
              {r.team_name ?? 'No team'} · {r.univ_name}
            </p>
          </li>
        ))}
      </ol>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 pl-5">Rank</TableHead>
              <TableHead>Student</TableHead>
              <TableHead className="hidden md:table-cell">University</TableHead>
              <TableHead className="hidden w-[30%] sm:table-cell">
                <span className="sr-only">Bar</span>
              </TableHead>
              <TableHead className="w-20 pr-5 text-right">Solved</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.user_id} className={cn(r.user_id === meId && 'bg-secondary')}>
                <TableCell className="pl-5 tabular-nums text-muted-foreground">{r.rank}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Initials name={r.name} />
                    {/* Table cells grow to fit their text, so cap the width for truncate to work. */}
                    <div className="min-w-0 max-w-[11rem] sm:max-w-xs">
                      <p className="truncate text-sm font-medium">
                        {r.name}
                        {r.user_id === meId && <span className="font-normal text-muted-foreground"> (you)</span>}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">{r.team_name ?? 'No team'}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden text-xs text-muted-foreground md:table-cell">{r.univ_name}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <span className="block h-1.5 rounded-full bg-foreground" style={{ width: `${(100 * r.solved) / top}%` }} />
                </TableCell>
                <TableCell className="pr-5 text-right font-medium tabular-nums">{r.solved}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  )
}
