import { Empty, Initials, Loaded, Section } from '@/components/bits'
import { useApi, type MemberStats, type TeamAnalytics as Data } from '@/lib/api'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

/*
 * Comparative analytics for the signed-in user's team (GET /api/teams/mine/analytics).
 * Monochrome on purpose: members are told apart by position and name, never by
 * colour — each member gets their own row or column.
 */

interface Metric {
  label: string
  hint: string
  value: (m: MemberStats) => number | null
  format?: (v: number, m: MemberStats) => string
}

const METRICS: Metric[] = [
  {
    label: 'Codeforces rating',
    hint: 'current, from the last sync',
    value: (m) => m.cf_rating,
    format: (v, m) => (m.cf_max_rating ? `${v} (best ${m.cf_max_rating})` : String(v)),
  },
  { label: 'Problems solved', hint: 'all time, distinct', value: (m) => m.solved },
  { label: 'Solved this month', hint: 'first solved in the last 30 days', value: (m) => m.solved_30d },
  { label: 'Active days', hint: 'days with a submission, last 30', value: (m) => m.active_days_30, format: (v) => `${v} / 30` },
  { label: 'Current streak', hint: 'days in a row, up to today', value: (m) => m.current_streak, format: (v, m) => `${v}d (best ${m.longest_streak}d)` },
  { label: 'Acceptance', hint: 'accepted ÷ all submissions', value: (m) => m.acceptance, format: (v) => `${v}%` },
  { label: 'Average difficulty', hint: 'mean rating of solved problems', value: (m) => m.avg_solved_rating },
  { label: 'Hardest solved', hint: 'highest-rated accepted problem', value: (m) => m.hardest_solved },
  { label: 'Only they solved', hint: 'nobody else in the team has these', value: (m) => m.unique_solves },
]

/* Core ICPC topics (Codeforces tag names) shown in the coverage grid. */
const CORE_TOPICS = [
  'dp', 'graphs', 'math', 'greedy', 'data structures', 'number theory',
  'strings', 'binary search', 'trees', 'combinatorics', 'geometry', 'constructive algorithms',
]

/* Sequential ramp for the heatmap: one hue (ink), light -> dark. */
const RAMP = ['bg-secondary', 'bg-[hsl(0_0%_86%)]', 'bg-[hsl(0_0%_68%)]', 'bg-[hsl(0_0%_42%)]', 'bg-[hsl(0_0%_15%)]']

const firstName = (name: string) => name.split(' ')[0]

/* Codeforces tags are lower-case ("dp", "number theory"); show them as titles. */
const topicLabel = (tag: string) =>
  tag === 'dp' ? 'DP' : tag.replace(/\b\w/g, (c) => c.toUpperCase())

export function TeamAnalytics() {
  const state = useApi<Data | null>('/teams/mine/analytics')

  return (
    <Loaded state={state}>
      {(data) =>
        !data || data.members.length === 0 ? null : (
          <div className="space-y-5">
            <Insights data={data} />
            <HeadToHead members={data.members} />
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <WeeklyActivity data={data} />
              <TopicCoverage data={data} />
            </div>
          </div>
        )
      }
    </Loaded>
  )
}

/* ---------------------------------------------------------------- insights */

function leader(members: MemberStats[], value: (m: MemberStats) => number | null) {
  let best: MemberStats | null = null
  for (const m of members) {
    const v = value(m)
    if (v != null && v > 0 && (best === null || v > (value(best) ?? 0))) best = m
  }
  return best
}

function Insights({ data }: { data: Data }) {
  const { members } = data
  const lines: string[] = []

  const consistent = leader(members, (m) => m.active_days_30)
  if (consistent) lines.push(`Most consistent: ${consistent.name}, active on ${consistent.active_days_30} of the last 30 days.`)

  const month = leader(members, (m) => m.solved_30d)
  if (month) lines.push(`Most solved this month: ${month.name}, with ${month.solved_30d} new problems.`)

  const rated = leader(members, (m) => m.cf_rating)
  if (rated) lines.push(`Highest rated: ${rated.name} at ${rated.cf_rating}.`)

  const totals = CORE_TOPICS.map((t) => ({
    topic: t,
    total: data.topics.filter((r) => r.topic_name === t).reduce((n, r) => n + r.solved, 0),
  })).sort((a, b) => a.total - b.total)
  // Skip it before the first sync, when every topic is still at zero.
  if (totals.length && totals[totals.length - 1].total > 0 && members.length > 1)
    lines.push(`Team gap: ${topicLabel(totals[0].topic)}, only ${totals[0].total} solved between you. A good topic for the next shared sheet.`)

  const idle = members.filter((m) => m.active_days_30 === 0)
  if (idle.length) lines.push(`No activity in 30 days: ${idle.map((m) => m.name).join(', ')}. Sync again or nudge them.`)

  if (lines.length === 0) return null
  return (
    <Section title="Insights">
      <ul className="space-y-2 text-sm">
        {lines.map((l) => (
          <li key={l} className="flex gap-3">
            <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-foreground" />
            {l}
          </li>
        ))}
      </ul>
    </Section>
  )
}

/* ---------------------------------------------------------------- head to head */

function HeadToHead({ members }: { members: MemberStats[] }) {
  return (
    <Section title="Head to head">
      <div className="scroll-slim -mx-5 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr>
              <th className="w-[30%] pb-4 text-left align-bottom font-normal">
                <span className="sr-only">Metric</span>
              </th>
              {members.map((m) => (
                <th key={m.user_id} className="pb-4 pl-4 text-left align-bottom font-normal">
                  <div className="flex items-center gap-2.5">
                    <Initials name={m.name} />
                    {/* table cells grow to fit, so truncate needs a cap */}
                    <div className="min-w-0 max-w-[12rem]">
                      <p className="truncate font-medium">{m.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{m.cf_handle ?? 'no handle'}</p>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRICS.map((metric) => {
              const values = members.map(metric.value)
              const max = Math.max(0, ...values.map((v) => v ?? 0))
              return (
                <tr key={metric.label} className="border-t border-border">
                  <th scope="row" className="py-3 pr-4 text-left align-top font-normal">
                    <p className="text-sm">{metric.label}</p>
                    <p className="text-[11px] text-muted-foreground">{metric.hint}</p>
                  </th>
                  {members.map((m, i) => {
                    const v = values[i]
                    const best = v != null && v > 0 && v === max && members.length > 1
                    return (
                      <td key={m.user_id} className="py-3 pl-4 align-top">
                        <p className={cn('tabular-nums', best ? 'font-semibold' : 'text-muted-foreground')}>
                          {v == null ? '—' : metric.format ? metric.format(v, m) : v.toLocaleString()}
                          {best && <span className="sr-only"> (team best)</span>}
                        </p>
                        <div className="mt-1.5 h-1 rounded-full bg-secondary">
                          <div
                            className={cn('h-1 rounded-full', best ? 'bg-foreground' : 'bg-[hsl(0_0%_62%)]')}
                            style={{ width: `${max > 0 && v ? (100 * v) / max : 0}%` }}
                          />
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">Bold = best in the team for that row.</p>
    </Section>
  )
}

/* ---------------------------------------------------------------- weekly activity */

function WeeklyActivity({ data }: { data: Data }) {
  const max = Math.max(1, ...Object.values(data.weekly).flat())

  return (
    <Section title="Problems solved per week">
      <div className="space-y-5">
        {data.members.map((m) => {
          const counts = data.weekly[m.user_id] ?? []
          const total = counts.reduce((a, b) => a + b, 0)
          return (
            <div key={m.user_id}>
              <div className="flex items-baseline justify-between gap-3 text-xs">
                <span className="min-w-0 truncate font-medium">{m.name}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">{total} in 12 weeks</span>
              </div>
              <div className="mt-2 flex h-14 items-end gap-0.5 border-b border-border" role="list" aria-label={`${m.name}, problems solved per week`}>
                {counts.map((n, i) => {
                  const label = `${m.name} · week of ${formatDate(data.weeks[i])}: ${n} solved`
                  return (
                    <div
                      key={data.weeks[i]}
                      role="listitem"
                      tabIndex={0}
                      aria-label={label}
                      className="group relative flex h-full flex-1 items-end justify-center outline-none"
                    >
                      <div
                        className="w-full max-w-6 rounded-t-[4px] bg-foreground transition-opacity group-hover:opacity-70 group-focus-visible:opacity-70"
                        style={{ height: n ? `${Math.max(6, (100 * n) / max)}%` : 0 }}
                      />
                      {/* Edge bars anchor their tooltip inwards so it stays inside the card on phones */}
                      <span
                        className={cn(
                          'pointer-events-none absolute bottom-full z-10 mb-1 hidden whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[11px] text-background group-hover:block group-focus-visible:block',
                          i < 2 ? 'left-0' : i >= counts.length - 2 ? 'right-0' : 'left-1/2 -translate-x-1/2'
                        )}
                      >
                        <b className="tabular-nums">{n}</b> · week of {formatDate(data.weeks[i])}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{data.weeks.length > 0 && formatDate(data.weeks[0])}</span>
          <span>this week</span>
        </div>
      </div>
    </Section>
  )
}

/* ---------------------------------------------------------------- topic coverage */

function TopicCoverage({ data }: { data: Data }) {
  const solved = (user_id: number, topic: string) =>
    data.topics.find((r) => r.user_id === user_id && r.topic_name === topic)?.solved ?? 0
  const rows = CORE_TOPICS.map((topic) => ({
    topic,
    counts: data.members.map((m) => solved(m.user_id, topic)),
  })).sort((a, b) => b.counts.reduce((x, y) => x + y, 0) - a.counts.reduce((x, y) => x + y, 0))
  const max = Math.max(1, ...rows.flatMap((r) => r.counts))
  const step = (n: number) => (n === 0 ? 0 : Math.min(4, 1 + Math.floor((3.999 * n) / max)))

  if (rows.every((r) => r.counts.every((n) => n === 0)))
    return (
      <Section title="Topic coverage">
        <Empty>Sync submissions to see who covers which topic.</Empty>
      </Section>
    )

  return (
    <Section title="Topic coverage">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="pb-2 text-left font-normal text-muted-foreground">Problems solved per topic</th>
            {data.members.map((m) => (
              <th key={m.user_id} className="w-16 pb-2 text-center font-medium sm:w-20">
                {/* the cap keeps a long first name from widening the column */}
                <span title={m.name} className="mx-auto block max-w-[4rem] truncate sm:max-w-[5rem]">
                  {firstName(m.name)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const best = Math.max(...r.counts)
            return (
              <tr key={r.topic}>
                <th scope="row" className="py-px pr-3 text-left font-normal text-muted-foreground">
                  {topicLabel(r.topic)}
                </th>
                {r.counts.map((n, i) => {
                  const s = step(n)
                  return (
                    <td key={data.members[i].user_id} className="p-px">
                      <div
                        tabIndex={0}
                        title={`${data.members[i].name} · ${topicLabel(r.topic)}: ${n} solved`}
                        className={cn(
                          'grid h-7 place-items-center rounded-[4px] tabular-nums outline-none transition-[filter] hover:brightness-90 focus-visible:ring-2 focus-visible:ring-ring',
                          RAMP[s],
                          s >= 3 ? 'text-background' : 'text-foreground',
                          n === best && n > 0 && data.members.length > 1 && 'font-semibold'
                        )}
                      >
                        {n.toLocaleString()}
                      </div>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="mt-4 flex items-center gap-2 text-[10px] text-muted-foreground" aria-hidden>
        <span>fewer</span>
        {RAMP.map((c) => (
          <span key={c} className={cn('h-2.5 w-5 rounded-[2px]', c)} />
        ))}
        <span>more</span>
      </div>
    </Section>
  )
}
