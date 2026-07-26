import { useMemo } from 'react'
import {
  Building2,
  CalendarDays,
  CircleCheck,
  Globe,
  GraduationCap,
  Link2,
  MessageSquare,
  Pencil,
  Plus,
  Trophy,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth } from '@/lib/auth'
import {
  achievements,
  activity,
  contestPerformance,
  currentUser,
  difficultyVariant,
  formatDate,
  myTeam,
  people,
  problems,
  ratingColor,
  ratingHistory,
  ROLE_LABEL,
  topicMastery,
} from '@/lib/data'
import { cn } from '@/lib/utils'

const SOLVED_DATES = [
  '2026-07-26', '2026-07-25', '2026-07-24', '2026-07-22', '2026-07-21',
  '2026-07-19', '2026-07-18', '2026-07-16', '2026-07-15', '2026-07-13',
  '2026-07-12', '2026-07-10',
]

function ProfileTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value?: number | string }[]
  label?: string | number
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 shadow-xl">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-medium">{payload[0]?.value} rating</p>
    </div>
  )
}

export default function Profile() {
  const { handle } = useParams()
  const { user } = useAuth()

  const person = useMemo(() => {
    if (handle) return people.find((p) => p.handle === handle) ?? currentUser
    return user ?? currentUser
  }, [handle, user])

  const isSelf = !handle || person.handle === (user?.handle ?? currentUser.handle)

  const solved = useMemo(
    () => problems.filter((p) => p.status === 'solved').slice(0, 12),
    []
  )
  const unlocked = achievements.filter((a) => a.unlocked)

  return (
    <div className="space-y-6">
      <PageHeader
        title={isSelf ? 'Your Profile' : 'Profile'}
        description="Achievements, ratings, contest history and connected judge accounts — the public record of the work."
        actions={
          isSelf ? (
            <Button size="pill" asChild>
              <Link to="/app/settings">
                <Pencil className="h-4 w-4" /> Edit profile
              </Link>
            </Button>
          ) : (
            <>
              <Button variant="outline" size="pill">
                <UserPlus className="h-4 w-4" /> Follow
              </Button>
              <Button size="pill" asChild>
                <Link to="/app/messages">
                  <MessageSquare className="h-4 w-4" /> Message
                </Link>
              </Button>
            </>
          )
        }
      />

      {/* -------------------------------------------------- Banner */}
      <Card className="overflow-hidden">
        <div className="relative h-32 bg-[radial-gradient(600px_200px_at_20%_100%,hsl(var(--primary)/0.45),transparent_70%),linear-gradient(120deg,hsl(258_90%_28%),hsl(255_40%_10%))]" />

        <div className="px-6 pb-6">
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
            <img
              src={person.avatar}
              alt=""
              className="h-24 w-24 rounded-full bg-secondary ring-4 ring-card"
            />
            <div className="flex flex-wrap gap-2 pb-1">
              <Badge variant="secondary">{ROLE_LABEL[person.role]}</Badge>
              <Badge variant="default">{person.rank}</Badge>
            </div>
          </div>

          <h2
            className="mt-4 text-4xl leading-tight tracking-tight"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            {person.name}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">@{person.handle}</p>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {person.bio}
          </p>

          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" /> {person.college}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5" /> {person.year}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" /> {person.country}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" /> Joined {person.joinedAt}
            </span>
          </div>
        </div>
      </Card>

      {/* -------------------------------------------------- Stat strip */}
      <Card className="overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-y divide-border/50 sm:grid-cols-3 sm:divide-y-0 lg:grid-cols-6">
          {[
            { label: 'Rating', value: person.rating, tint: ratingColor(person.rating) },
            { label: 'Peak rating', value: person.maxRating },
            { label: 'Solved', value: person.solved },
            { label: 'Contests', value: 18 },
            { label: 'Streak', value: `${person.streak}d` },
            { label: 'Global rank', value: '#27' },
          ].map((s) => (
            <div key={s.label} className="px-5 py-5">
              <p
                className={cn(
                  'text-2xl font-medium tabular-nums tracking-tight',
                  s.tint
                )}
              >
                {s.value}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* -------------------------------------------------- Connected accounts */}
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-medium">Connected accounts</h2>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {person.platforms.map((p) => (
            <div
              key={p.platform}
              className="flex items-center gap-3 rounded-2xl border border-border/60 bg-secondary/30 p-4"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-xs font-medium text-primary">
                {p.platform.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.platform}</p>
                <p className="truncate text-xs text-muted-foreground">
                  @{p.handle} · {p.rating}
                </p>
              </div>
              <Badge variant="success">
                <CircleCheck className="h-3 w-3" /> Synced
              </Badge>
            </div>
          ))}

          <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-muted-foreground">
              <Plus className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">SPOJ</p>
              <p className="truncate text-xs text-muted-foreground">
                Not connected
              </p>
            </div>
            {isSelf && (
              <Button variant="secondary" size="sm" asChild>
                <Link to="/app/settings">Connect</Link>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* -------------------------------------------------- Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="solved">Solved</TabsTrigger>
          <TabsTrigger value="contests">Contests</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="p-6 lg:col-span-2">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-medium">Rating progression</h2>
              </div>
              <div className="mt-6 h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={ratingHistory}
                    margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                  >
                    <defs>
                      <linearGradient id="profileRatingFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      domain={['dataMin - 120', 'dataMax + 120']}
                    />
                    <Tooltip content={<ProfileTooltip />} cursor={false} />
                    <Area
                      type="monotone"
                      dataKey="rating"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#profileRatingFill)"
                      dot={false}
                    
                  isAnimationActive={false}
                />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 border-t border-border/50 pt-5">
                <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Topic strengths
                </h3>
                <ul className="mt-4 space-y-3">
                  {topicMastery.slice(0, 5).map((t) => (
                    <li key={t.topic}>
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="truncate">{t.topic}</span>
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {t.mastery}%
                        </span>
                      </div>
                      <Progress value={t.mastery} className="mt-2 h-1.5" />
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-medium">Recent activity</h2>
              </div>
              <ul className="mt-5 divide-y divide-border/50">
                {activity.map((a) => (
                  <li key={a.id} className="py-3 first:pt-0">
                    <p className="text-sm">{a.text}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {a.detail} · {a.time}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="solved">
          <Card className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Problem</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="text-right">Solved on</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {solved.map((p, i) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {p.code}
                      </p>
                      <p className="text-sm font-medium">{p.title}</p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.platform}
                    </TableCell>
                    <TableCell>
                      <Badge variant={difficultyVariant(p.difficulty)}>
                        {p.difficulty}
                      </Badge>
                    </TableCell>
                    <TableCell className="tabular-nums">{p.rating}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {formatDate(SOLVED_DATES[i % SOLVED_DATES.length])}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="contests">
          <Card className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contest</TableHead>
                  <TableHead>Rank</TableHead>
                  <TableHead>Solved</TableHead>
                  <TableHead className="text-right">Delta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contestPerformance.map((c) => (
                  <TableRow key={c.name}>
                    <TableCell className="text-sm font-medium">{c.name}</TableCell>
                    <TableCell className="tabular-nums">#{c.rank}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {c.solved} / {c.total}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          'text-sm font-medium tabular-nums',
                          c.delta >= 0 ? 'text-success' : 'text-destructive'
                        )}
                      >
                        {c.delta >= 0 ? '+' : ''}
                        {c.delta}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="achievements">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {unlocked.map((a) => (
              <Card key={a.id} className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-lime/15 text-lime">
                    <Trophy className="h-5 w-5" />
                  </span>
                  <Badge variant="lime">{a.tier}</Badge>
                </div>
                <h3 className="mt-4 text-base font-medium tracking-tight">
                  {a.name}
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {a.description}
                </p>
                <p className="mt-4 text-xs text-muted-foreground">+{a.xp} XP</p>
              </Card>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="mt-4" asChild>
            <Link to="/app/achievements">See all achievements</Link>
          </Button>
        </TabsContent>
      </Tabs>

      {/* -------------------------------------------------- Team */}
      <Card className="flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="flex items-center gap-4">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-medium">{myTeam.name}</p>
            <p className="text-xs text-muted-foreground">
              {myTeam.university} · Rank #{myTeam.rank} · {myTeam.contests} contests
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex -space-x-2">
            {myTeam.members.map((m) => (
              <img
                key={m.id}
                src={m.avatar}
                alt=""
                title={m.name}
                className="h-8 w-8 rounded-full bg-secondary ring-2 ring-card"
              />
            ))}
          </div>
          <Button variant="secondary" size="pill" asChild>
            <Link to="/app/teams">View team</Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}
