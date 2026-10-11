import { ArrowUpRight, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import {
  DifficultyBadge,
  Empty,
  Loaded,
  Section,
  SqlPeek,
  Stat,
  StatRow,
  VerdictBadge,
} from '@/components/bits'
import { SyncButton } from '@/components/SyncButton'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { problemUrl, useApi, type Dashboard as DashboardData, type Difficulty } from '@/lib/api'
import { useMe } from '@/lib/auth'
import { daysLeft, deadlineLabel, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'

const SQL = `
-- My numbers (backend/routes/dashboard.py)
SELECT count(DISTINCT problem_code) FILTER (WHERE verdict = 'OK') AS solved,
       count(*)                                                   AS submissions,
       round(100.0 * count(*) FILTER (WHERE verdict = 'OK') / count(*)) AS acceptance
FROM submission WHERE user_id = :me;

-- Solved per topic: topic ⋈ problem_topic ⟕ submission
SELECT t.topic_name,
       count(DISTINCT pt.problem_code) AS total,
       count(DISTINCT pt.problem_code) FILTER (WHERE s.problem_code IS NOT NULL) AS solved
FROM topic t
JOIN problem_topic pt  ON pt.topic_id = t.topic_id
LEFT JOIN submission s ON s.problem_code = pt.problem_code
                      AND s.user_id = :me AND s.verdict = 'OK'
GROUP BY t.topic_name;

-- Up next: my team's sheet problems I have not solved (NOT EXISTS)
SELECT sh.title, sp.position, p.*
FROM sheet sh
JOIN sheet_problem sp ON sp.sheet_id = sh.sheet_id
JOIN problem p        ON p.problem_code = sp.problem_code
WHERE sh.team_id = :my_team
  AND NOT EXISTS (SELECT 1 FROM submission s
                  WHERE s.user_id = :me AND s.problem_code = sp.problem_code
                    AND s.verdict = 'OK')
ORDER BY sh.deadline, sp.position;`

/** Same bands as the v_problem_difficulty view. */
function bandOf(rating: number | null): Difficulty | null {
  if (rating == null) return null
  return rating < 1400 ? 'Easy' : rating < 2000 ? 'Medium' : 'Hard'
}

export default function Dashboard() {
  const me = useMe()
  const state = useApi<DashboardData>('/dashboard')

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display break-words text-4xl sm:text-5xl">Hi, {me.name.split(' ')[0]}.</h1>
          <p className="mt-3 text-xs text-muted-foreground">
            {me.team_name ?? 'No team yet'} · {me.univ_name}
          </p>
        </div>
        <SyncButton onDone={state.reload} />
      </div>

      <Loaded state={state}>
        {(d) => {
          const maxTopic = Math.max(1, ...d.by_topic.map((x) => x.total))
          return (
            <>
              <StatRow className="grid-cols-2 lg:grid-cols-4">
                <Stat label="Solved" value={d.stats.solved} hint={`of ${d.stats.problems} problems in the database`} />
                <Stat label="Submissions" value={d.stats.submissions} />
                <Stat label="Acceptance" value={`${d.stats.acceptance}%`} hint="accepted ÷ all submissions" />
                <Stat label="Rank" value={`#${d.stats.rank}`} hint={`of ${d.stats.players} students`} />
              </StatRow>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
                <Section
                  title="Up next from your sheets"
                  className="lg:col-span-7"
                  action={
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/app/sheets">
                        Sheets <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  }
                >
                  {!me.team_id ? (
                    <Empty>
                      Join a team to get practice sheets.{' '}
                      <Link to="/app/team" className="text-foreground underline underline-offset-2">
                        Find a team
                      </Link>
                    </Empty>
                  ) : d.up_next.length === 0 ? (
                    <Empty>Nothing left on your team's sheets.</Empty>
                  ) : (
                    <ul className="-my-1 divide-y divide-border">
                      {d.up_next.map((p) => (
                        <li key={`${p.sheet_id}-${p.problem_code}`} className="flex items-center gap-4 py-3">
                          <span className="w-16 shrink-0 font-mono text-xs text-muted-foreground">{p.problem_code}</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm">{p.title}</p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              {p.sheet_title} · #{p.position}
                            </p>
                          </div>
                          <DifficultyBadge difficulty={bandOf(p.rating)} />
                          <a
                            href={problemUrl(p.problem_code)}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Open ${p.problem_code} on Codeforces`}
                            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </Section>

                <Section title="Your sheet progress" className="lg:col-span-5">
                  {d.sheets.length === 0 ? (
                    <Empty>No sheets for your team yet.</Empty>
                  ) : (
                    <ul className="space-y-5">
                      {d.sheets.map((sh) => {
                        const overdue = sh.deadline != null && daysLeft(sh.deadline) < 0 && sh.solved < sh.total
                        return (
                          <li key={sh.sheet_id}>
                            <div className="flex items-baseline justify-between gap-3">
                              <p className="truncate text-sm">{sh.title}</p>
                              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                                {sh.solved}/{sh.total}
                              </span>
                            </div>
                            <Progress value={sh.total ? (100 * sh.solved) / sh.total : 0} className="mt-2 h-1.5" />
                            <p className={cn('mt-1.5 text-[11px] text-muted-foreground', overdue && 'font-medium text-foreground')}>
                              {sh.total > 0 && sh.solved === sh.total ? 'Complete' : deadlineLabel(sh.deadline)}
                            </p>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </Section>
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
                <Section
                  title="Recent submissions"
                  className="lg:col-span-7"
                  action={
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/app/submissions">
                        All <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  }
                >
                  {d.recent.length === 0 ? (
                    <Empty>No submissions yet. Sync from Codeforces to import yours.</Empty>
                  ) : (
                    <ul className="-my-1 divide-y divide-border">
                      {d.recent.map((s) => (
                        <li key={s.submitted_at + s.problem_code} className="flex items-center gap-4 py-3">
                          <span className="w-16 shrink-0 font-mono text-xs text-muted-foreground">{s.problem_code}</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm">{s.title}</p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              {s.language} · {timeAgo(s.submitted_at)}
                            </p>
                          </div>
                          <VerdictBadge verdict={s.verdict} />
                        </li>
                      ))}
                    </ul>
                  )}
                </Section>

                <Section title="Solved by topic" className="lg:col-span-5">
                  {d.by_topic.length === 0 ? (
                    <Empty>Topics appear once problems are in the database.</Empty>
                  ) : (
                    <ul className="space-y-2.5">
                      {d.by_topic.map((x) => (
                        <li key={x.topic_name} className="grid grid-cols-[7.5rem_minmax(0,1fr)_4.5rem] items-center gap-3 text-xs">
                          <span className="truncate capitalize text-muted-foreground">{x.topic_name}</span>
                          <span className="relative h-2 rounded-full bg-secondary" style={{ width: `${(100 * x.total) / maxTopic}%` }}>
                            <span
                              className="absolute inset-y-0 left-0 rounded-full bg-foreground"
                              style={{ width: `${(100 * x.solved) / x.total}%` }}
                            />
                          </span>
                          <span className="text-right tabular-nums">
                            {x.solved}/{x.total}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-border bg-border">
                    {(['Easy', 'Medium', 'Hard'] as const).map((band) => {
                      const x = d.by_difficulty.find((r) => r.difficulty === band)
                      return (
                        <div key={band} className="bg-card px-3 py-3">
                          <p className="flex flex-wrap items-baseline text-lg font-medium tabular-nums">
                            {x?.solved ?? 0}
                            <span className="text-xs text-muted-foreground">/{x?.total ?? 0}</span>
                          </p>
                          <p className="text-[11px] text-muted-foreground">{band}</p>
                        </div>
                      )
                    })}
                  </div>
                </Section>
              </div>
            </>
          )
        }}
      </Loaded>

      <SqlPeek sql={SQL} label="SQL behind this page" />
    </div>
  )
}
