import { useState } from 'react'
import { LogOut, Plus, RefreshCw, UserPlus } from 'lucide-react'

import { Empty, ErrorNote, Initials, Loaded, Section, SqlPeek } from '@/components/bits'
import { PageHeader } from '@/components/layout/PageHeader'
import { TeamAnalytics } from '@/components/TeamAnalytics'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { api, attempt, useApi, type MyTeam, type TeamRow } from '@/lib/api'
import { useAuth, useMe } from '@/lib/auth'
import { cn } from '@/lib/utils'

const SQL = `
-- All teams with member count, including empty teams (LEFT JOIN)
SELECT t.team_name, count(DISTINCT u.user_id) AS members,
       count(DISTINCT s.problem_code)  AS solved
FROM team t
LEFT JOIN app_user u   ON u.team_id = t.team_id
LEFT JOIN submission s ON s.user_id = u.user_id AND s.verdict = 'OK'
GROUP BY t.team_name;

-- Joining a team is just an UPDATE of the foreign key ...
UPDATE app_user SET team_id = :team WHERE user_id = :me;

-- ... checked by this trigger (a CHECK constraint cannot count other rows)
CREATE TRIGGER team_size_check
  BEFORE INSERT OR UPDATE OF team_id ON app_user
  FOR EACH ROW EXECUTE FUNCTION check_team_size();
  -- raises 'team % already has 3 members'`

export default function Team() {
  const me = useMe()
  const { refresh } = useAuth()
  const mine = useApi<MyTeam | null>('/teams/mine')
  const all = useApi<TeamRow[]>('/teams')
  const [error, setError] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncNote, setSyncNote] = useState<string | null>(null)
  const [analyticsVersion, setAnalyticsVersion] = useState(0)

  async function syncTeam() {
    setSyncing(true)
    setSyncNote(null)
    try {
      const results = await api.post<{ name: string; new_submissions?: number; error?: string }[]>('/teams/mine/sync')
      setSyncNote(
        results.length === 0
          ? 'Nobody in the team has a Codeforces handle yet.'
          : results.map((r) => (r.error ? `${r.name}: ${r.error}` : `${r.name}: +${r.new_submissions ?? 0}`)).join(' · ')
      )
      mine.reload()
      setAnalyticsVersion((v) => v + 1)
    } catch (e) {
      setSyncNote(e instanceof Error ? e.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  async function run(action: () => Promise<unknown>) {
    const err = await attempt(action)
    setError(err)
    if (!err) {
      await refresh() // the sidebar shows the team name
      mine.reload()
      all.reload()
    }
    return err
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="My team"
        description="An ICPC team is at most three students. A student is in at most one team."
        actions={
          me.team_id ? (
            <div className="flex flex-col items-start gap-1 sm:items-end">
              <Button size="pill" onClick={syncTeam} disabled={syncing}>
                <RefreshCw className={syncing ? 'animate-spin' : undefined} />
                {syncing ? 'Syncing everyone…' : 'Sync whole team'}
              </Button>
              {syncNote && <p role="status" className="max-w-sm break-words text-[11px] text-muted-foreground sm:text-right">{syncNote}</p>}
            </div>
          ) : undefined
        }
      />

      <ErrorNote error={error} />

      <Loaded state={mine}>
        {(team) =>
          team ? (
            <Section
              title="Your team"
              action={
                <Button variant="ghost" size="sm" onClick={() => run(() => api.post('/teams/leave'))}>
                  <LogOut className="h-3.5 w-3.5" /> Leave team
                </Button>
              }
            >
              <div className="flex flex-wrap items-end justify-between gap-4">
                <h2 className="min-w-0 break-words font-display text-3xl">{team.team_name}</h2>
                <p className="text-xs text-muted-foreground">
                  {team.solved} distinct problems solved together · {team.sheets} sheets
                </p>
              </div>
              <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[0, 1, 2].map((i) => {
                  const m = team.members[i]
                  if (!m)
                    return (
                      <li key={i} className="grid min-h-[104px] place-items-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                        Open seat
                      </li>
                    )
                  return (
                    <li key={m.user_id} className={cn('rounded-lg border p-4', m.user_id === me.user_id ? 'border-foreground' : 'border-border')}>
                      <div className="flex items-center gap-3">
                        <Initials name={m.name} className="h-10 w-10 text-xs" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {m.name}
                            {m.user_id === me.user_id && <span className="font-normal text-muted-foreground"> (you)</span>}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">{m.cf_handle ?? 'no handle'}</p>
                        </div>
                      </div>
                      <p className="mt-4 text-2xl font-medium tabular-nums">{m.solved}</p>
                      <p className="truncate text-[11px] text-muted-foreground">solved · {m.univ_name}</p>
                    </li>
                  )
                })}
              </ul>
            </Section>
          ) : (
            <Section title="Create a team">
              <form
                className="flex flex-col gap-3 sm:flex-row"
                onSubmit={async (e) => {
                  e.preventDefault()
                  const err = await run(() => api.post('/teams', { team_name: newName }))
                  if (!err) setNewName('')
                }}
              >
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Team name (must be unique)" aria-label="Team name" className="sm:max-w-sm" />
                <Button type="submit">
                  <Plus /> Create and join
                </Button>
              </form>
              <p className="mt-3 text-[11px] text-muted-foreground">Or join an existing team below.</p>
            </Section>
          )
        }
      </Loaded>

      {me.team_id && <TeamAnalytics key={`${me.team_id}-${analyticsVersion}`} />}

      <Card className="overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="paper-label text-muted-foreground">All teams</h2>
        </div>
        <Loaded state={all}>
          {(teams) =>
            teams.length === 0 ? (
              <div className="p-5">
                <Empty>No teams yet. Create the first one.</Empty>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-5">Team</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead className="w-20 text-right">Seats</TableHead>
                    <TableHead className="w-24 text-right">Solved</TableHead>
                    <TableHead className="w-28 pr-5 text-right">
                      <span className="sr-only">Action</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map((team) => (
                    <TableRow key={team.team_id}>
                      <TableCell className="pl-5 text-sm font-medium">{team.team_name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{team.member_names || '—'}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{team.members}/3</TableCell>
                      <TableCell className="text-right tabular-nums">{team.solved}</TableCell>
                      <TableCell className="pr-5 text-right">
                        {team.team_id === me.team_id ? (
                          <span className="text-[11px] text-muted-foreground">Your team</span>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={me.team_id != null}
                            title={me.team_id != null ? 'Leave your team first' : team.members >= 3 ? 'Full — the trigger will reject this' : undefined}
                            onClick={() => run(() => api.post(`/teams/${team.team_id}/join`))}
                          >
                            <UserPlus className="h-3.5 w-3.5" /> Join
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          }
        </Loaded>
      </Card>

      <SqlPeek sql={SQL} />
    </div>
  )
}
