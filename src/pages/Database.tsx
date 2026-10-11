import { useState } from 'react'
import { Eye, KeyRound, Link2, Table2 } from 'lucide-react'

import schemaSql from '../../docs/lite/schema-lite.sql?raw'

import { Empty, Loaded, SqlPeek } from '@/components/bits'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useApi } from '@/lib/api'
import { cn } from '@/lib/utils'

/* Column notes for the nine tables, matching docs/lite/schema-lite.sql. */
type TableName =
  | 'university' | 'team' | 'app_user' | 'topic' | 'problem'
  | 'problem_topic' | 'submission' | 'sheet' | 'sheet_problem'

const COLUMNS: Record<TableName, [string, string][]> = {
  university: [['univ_id', 'PK'], ['univ_name', 'UNIQUE'], ['city', '']],
  team: [['team_id', 'PK'], ['team_name', 'UNIQUE']],
  app_user: [
    ['user_id', 'PK'], ['name', ''], ['email', 'UNIQUE'], ['password_hash', ''],
    ['cf_handle', 'UNIQUE'], ['cf_rating', ''], ['cf_max_rating', ''], ['univ_id', 'FK → university'], ['team_id', 'FK → team'],
  ],
  topic: [['topic_id', 'PK'], ['topic_name', 'UNIQUE']],
  problem: [['problem_code', 'PK'], ['title', ''], ['rating', 'CHECK 800–3500']],
  problem_topic: [['problem_code', 'PK, FK → problem'], ['topic_id', 'PK, FK → topic']],
  submission: [
    ['user_id', 'PK, FK → app_user'], ['problem_code', 'PK, FK → problem'],
    ['submitted_at', 'PK'], ['verdict', 'CHECK'], ['language', ''],
  ],
  sheet: [['sheet_id', 'PK'], ['title', ''], ['team_id', 'FK → team'], ['deadline', '']],
  sheet_problem: [
    ['sheet_id', 'PK, FK → sheet'], ['problem_code', 'PK, FK → problem'], ['position', 'UNIQUE with sheet_id'],
  ],
}

const NOTES: Record<TableName, string> = {
  university: 'Split out of the user data to remove the transitive dependency user_id → univ_id → univ_name (3NF).',
  team: 'Split out to remove user_id → team_id → team_name (3NF).',
  app_user: 'Candidate keys: user_id and email. team_id is nullable because team membership is optional.',
  topic: 'Lookup table so each topic name is stored once.',
  problem: 'Split out because problem_code → title, rating was a partial dependency on the submission key (2NF).',
  problem_topic: 'Junction table for the M:N Problem–Topic relationship; fixes the multi-valued "topics" column (1NF).',
  submission: 'Weak entity: identified by (user_id, problem_code, submitted_at).',
  sheet: 'A practice list owned by one team.',
  sheet_problem: 'Junction table for Sheet–Problem with an order. Two candidate keys: (sheet_id, problem_code) and (sheet_id, position).',
}

type ViewName = 'v_problem_difficulty' | 'v_leaderboard' | 'v_sheet_progress'
const VIEWS: ViewName[] = ['v_problem_difficulty', 'v_leaderboard', 'v_sheet_progress']

function ddlFor(name: string, kind: 'table' | 'view') {
  const re = kind === 'table'
    ? new RegExp(`CREATE TABLE ${name} \\([\\s\\S]*?\\n\\);`)
    : new RegExp(`CREATE VIEW ${name} AS[\\s\\S]*?;`)
  return schemaSql.match(re)?.[0] ?? ''
}

const PAGE = 25

export default function Database() {
  const [sel, setSel] = useState<{ kind: 'table'; name: TableName } | { kind: 'view'; name: ViewName }>({
    kind: 'table',
    name: 'app_user',
  })
  const [limit, setLimit] = useState(PAGE)
  const counts = useApi<Record<TableName, number>>('/database')
  const fetched = useApi<Record<string, unknown>[]>(`/database/${sel.name}`)
  // While a new table is loading, useApi still holds the previous table's rows.
  // Hide them so they never show up under the new table's columns.
  const state = fetched.loading ? { ...fetched, data: null, error: null } : fetched

  const rows = state.data ?? []
  const columns = sel.kind === 'table' ? COLUMNS[sel.name].map(([c]) => c) : Object.keys(rows[0] ?? {})
  const tableNames = Object.keys(COLUMNS) as TableName[]

  function pick(next: typeof sel) {
    setSel(next)
    setLimit(PAGE)
    counts.reload()
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Database"
        description="The nine tables and three views in PostgreSQL, read live through the Flask API. Change something on another page and it shows up here."
      />

      <div className="grid gap-5 lg:grid-cols-12">
        <nav aria-label="Tables and views" className="space-y-5 lg:col-span-3">
          <div>
            <p className="paper-label px-1 pb-2 text-muted-foreground">Tables</p>
            <ul className="space-y-0.5">
              {tableNames.map((n) => (
                <li key={n}>
                  <button
                    onClick={() => pick({ kind: 'table', name: n })}
                    aria-current={sel.name === n}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left font-mono text-xs transition-colors',
                      sel.name === n ? 'bg-card font-medium text-foreground ring-1 ring-border' : 'text-muted-foreground hover:bg-card/60 hover:text-foreground'
                    )}
                  >
                    <Table2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1 truncate">{n}</span>
                    <span className="tabular-nums">{counts.data?.[n] ?? ''}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="paper-label px-1 pb-2 text-muted-foreground">Views (derived, not stored)</p>
            <ul className="space-y-0.5">
              {VIEWS.map((n) => (
                <li key={n}>
                  <button
                    onClick={() => pick({ kind: 'view', name: n })}
                    aria-current={sel.name === n}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left font-mono text-xs transition-colors',
                      sel.name === n ? 'bg-card font-medium text-foreground ring-1 ring-border' : 'text-muted-foreground hover:bg-card/60 hover:text-foreground'
                    )}
                  >
                    <Eye className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{n}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="min-w-0 space-y-5 lg:col-span-9">
          <Card className="p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-mono text-lg">{sel.name}</h2>
              <span className="text-xs text-muted-foreground">
                {state.data === null ? '' : `${rows.length === 500 ? 'first 500' : rows.length} ${rows.length === 1 ? 'row' : 'rows'}`}
              </span>
            </div>
            {sel.kind === 'table' ? (
              <>
                <p className="mt-2 text-xs text-muted-foreground">{NOTES[sel.name]}</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {COLUMNS[sel.name].map(([c, note]) => (
                    <li key={c}>
                      <Badge variant={note.startsWith('PK') ? 'default' : 'outline'} className="font-mono font-normal">
                        {note.startsWith('PK') ? <KeyRound className="h-3 w-3" /> : note.includes('FK') ? <Link2 className="h-3 w-3" /> : null}
                        {c}
                        {note && <span className="opacity-60">{note.replace(/^PK,? ?/, '')}</span>}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">Computed from the base tables every time it is read, so it can never be out of date.</p>
            )}
            <div className="mt-4">
              <SqlPeek sql={ddlFor(sel.name, sel.kind)} label="DDL" />
            </div>
          </Card>

          <Card className="overflow-hidden">
            <Loaded state={state}>
              {() =>
                rows.length === 0 ? (
                  <div className="p-5">
                    <Empty>This {sel.kind} is empty.</Empty>
                  </div>
                ) : (
                  <RowsTable columns={columns} rows={rows.slice(0, limit)} />
                )
              }
            </Loaded>
            {rows.length > limit && (
              <div className="border-t border-border p-3 text-center">
                <Button variant="ghost" size="sm" onClick={() => setLimit((l) => l + PAGE * 4)}>
                  Show more ({rows.length - limit} hidden)
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

function RowsTable({ columns, rows }: { columns: string[]; rows: Record<string, unknown>[] }) {
  return (
    <div className="scroll-slim overflow-x-auto">
      <table className="w-full font-mono text-[11px]">
        <thead>
          <tr className="border-b border-border bg-secondary/50 text-left">
            {columns.map((c) => (
              <th key={c} className="whitespace-nowrap px-4 py-2.5 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border last:border-0">
              {columns.map((c) => {
                const v = r[c]
                const text = v == null ? 'NULL' : Array.isArray(v) ? `{${v.join(',')}}` : String(v)
                return (
                  <td key={c} className={cn('whitespace-nowrap px-4 py-2', v == null && 'text-muted-foreground')}>
                    {/* max-width does not apply to table cells, so the cap goes on a block inside */}
                    <span title={text} className="block max-w-[260px] truncate">
                      {text}
                    </span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
