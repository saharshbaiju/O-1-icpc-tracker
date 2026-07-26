import { useMemo, useState } from 'react'
import * as icons from 'lucide-react'
import { Check, Flame, Lock, Medal, Sparkles, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/StatCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/lib/auth'
import { achievements, compact, heatmap, leaderboard } from '@/lib/data'
import type { Achievement } from '@/lib/data'
import { cn } from '@/lib/utils'

const TIER_STYLE: Record<Achievement['tier'], { tile: string; badge: string }> = {
  bronze: { tile: 'bg-warning/15 text-warning', badge: 'warning' },
  silver: { tile: 'bg-secondary text-muted-foreground', badge: 'secondary' },
  gold: { tile: 'bg-lime/15 text-lime', badge: 'lime' },
  platinum: { tile: 'bg-primary/15 text-primary', badge: 'default' },
}

const MILESTONES = [
  { title: 'First accepted solution', detail: 'A + B on Codeforces', date: 'Jan 2024', done: true },
  { title: '100 problems solved', detail: 'Crossed the first century', date: 'Apr 2024', done: true },
  { title: 'First rated contest', detail: 'Div 3 Round 912 · rank 4,120', date: 'Feb 2025', done: true },
  { title: 'Specialist rating', detail: 'Broke 1400 for the first time', date: 'May 2025', done: true },
  { title: 'Joined Segfault Sentinels', detail: 'Team formed for the regional', date: 'Mar 2025', done: true },
  { title: 'Expert rating', detail: 'Peaked at 1912', date: 'Dec 2025', done: true },
  { title: '47-day practice streak', detail: 'Longest run so far', date: 'Jul 2026', done: true },
  { title: 'Candidate Master', detail: '2100 rating — 253 points to go', date: 'Upcoming', done: false },
  { title: 'ICPC Regional qualification', detail: 'Registration closes 8 Aug', date: 'Upcoming', done: false },
]

function Icon({ name, className }: { name: string; className?: string }) {
  const Cmp = (icons as unknown as Record<string, icons.LucideIcon>)[name]
  if (!Cmp) return <Trophy className={className} />
  return <Cmp className={className} />
}

export default function Achievements() {
  const { user } = useAuth()
  const [tab, setTab] = useState('all')

  const xp = user?.xp ?? 0
  const level = user?.level ?? 1
  const xpIntoLevel = xp % 1000
  const xpToNext = 1000 - xpIntoLevel

  const unlocked = achievements.filter((a) => a.unlocked)
  const inProgress = achievements.filter((a) => !a.unlocked)

  const byTab = useMemo<Record<string, Achievement[]>>(
    () => ({
      all: achievements,
      unlocked,
      progress: inProgress,
      tier: [...achievements].sort((a, b) => {
        const order = { platinum: 0, gold: 1, silver: 2, bronze: 3 }
        return order[a.tier] - order[b.tier]
      }),
    }),
    [unlocked, inProgress]
  )

  /* Last seven days of the submission heatmap drive the streak dots. */
  const lastWeek = heatmap.slice(-7)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Achievements"
        description="XP, badges, milestones and daily streaks — the long game of consistency, made visible."
        actions={
          <Button variant="outline" size="pill" asChild>
            <Link to="/app/leaderboard">XP leaderboard</Link>
          </Button>
        }
      />

      {/* -------------------------------------------------- Level + streak */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="relative overflow-hidden p-8 lg:col-span-2">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_300px_at_20%_0%,hsl(var(--primary)/0.25),transparent_70%)]"
          />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default">
                <Sparkles className="h-3.5 w-3.5" /> {user?.rank}
              </Badge>
              <Badge variant="secondary">{compact(xp)} XP total</Badge>
            </div>

            <div className="mt-6 flex flex-wrap items-end gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Level
                </p>
                <p
                  className="text-6xl leading-none tracking-tight"
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                  {level}
                </p>
              </div>
              <p className="mb-2 text-sm text-muted-foreground">
                {compact(xpToNext)} XP to level {level + 1}
              </p>
            </div>

            <Progress value={(xpIntoLevel / 1000) * 100} className="mt-6 h-2.5" />
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{xpIntoLevel} / 1000 XP this level</span>
              <span>{Math.round((xpIntoLevel / 1000) * 100)}%</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-lime" />
            <h2 className="text-sm font-medium">Practice streak</h2>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <Flame className="h-12 w-12 text-lime" />
            <div>
              <p className="text-4xl font-medium tabular-nums tracking-tight">
                {user?.streak}
              </p>
              <p className="text-xs text-muted-foreground">consecutive days</p>
            </div>
          </div>

          <p className="mt-6 text-xs uppercase tracking-wider text-muted-foreground">
            Last 7 days
          </p>
          <div className="mt-3 flex gap-2">
            {lastWeek.map((d) => (
              <div key={d.date} className="flex-1 text-center">
                <div
                  className={cn(
                    'h-9 rounded-xl',
                    d.count > 0 ? 'bg-lime/70' : 'bg-secondary'
                  )}
                />
                <p className="mt-1.5 text-[10px] text-muted-foreground">
                  {new Date(d.date).toLocaleDateString('en-GB', {
                    weekday: 'narrow',
                  })}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-5 text-xs text-muted-foreground">
            Longest streak: <span className="text-foreground">61 days</span>
          </p>
        </Card>
      </div>

      {/* -------------------------------------------------- Stats */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Badges earned"
          value={unlocked.length}
          hint={`of ${achievements.length} available`}
          icon="Medal"
          accent="lime"
        />
        <StatCard
          label="In progress"
          value={inProgress.length}
          hint="Partially complete"
          icon="Target"
          accent="warning"
        />
        <StatCard
          label="Total XP"
          value={compact(xp)}
          delta={9}
          hint={`Level ${level}`}
          icon="Zap"
          accent="primary"
        />
        <StatCard
          label="XP rank"
          value="#27"
          delta={4}
          hint="Globally"
          icon="Trophy"
          accent="chart-3"
        />
      </div>

      {/* -------------------------------------------------- Achievement grid */}
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unlocked">Unlocked</TabsTrigger>
            <TabsTrigger value="progress">In progress</TabsTrigger>
            <TabsTrigger value="tier">By tier</TabsTrigger>
          </TabsList>
          <span className="text-xs text-muted-foreground">
            {byTab[tab]?.length ?? 0} achievement
            {(byTab[tab]?.length ?? 0) === 1 ? '' : 's'}
          </span>
        </div>

        {Object.keys(byTab).map((key) => (
          <TabsContent key={key} value={key}>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {byTab[key].map((a) => {
                const style = TIER_STYLE[a.tier]
                const pct = Math.min(
                  100,
                  Math.round((a.progress / a.target) * 100)
                )
                return (
                  <Card
                    key={a.id}
                    className={cn('flex flex-col p-6', !a.unlocked && 'opacity-70')}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={cn(
                          'grid h-12 w-12 place-items-center rounded-2xl',
                          style.tile
                        )}
                      >
                        <Icon name={a.icon} className="h-5 w-5" />
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            style.badge as
                              | 'warning'
                              | 'secondary'
                              | 'lime'
                              | 'default'
                          }
                        >
                          {a.tier}
                        </Badge>
                        {!a.unlocked && (
                          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    <h3 className="mt-4 text-base font-medium tracking-tight">
                      {a.name}
                    </h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      {a.description}
                    </p>

                    <div className="mt-auto pt-5">
                      {a.unlocked ? (
                        <div className="flex items-center justify-between">
                          <Badge variant="success">
                            <Check className="h-3 w-3" /> Unlocked
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            +{a.xp} XP
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-baseline justify-between text-xs">
                            <span className="text-muted-foreground">
                              {a.progress} / {a.target}
                            </span>
                            <span>+{a.xp} XP</span>
                          </div>
                          <Progress value={pct} className="mt-2 h-1.5" />
                        </>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* -------------------------------------------------- Milestones + XP */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center gap-2">
            <Medal className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-medium">Milestones</h2>
          </div>

          <ol className="mt-6 space-y-0 border-l border-border pl-6">
            {MILESTONES.map((m) => (
              <li key={m.title} className="relative pb-6 last:pb-0">
                <span
                  className={cn(
                    'absolute -left-[29px] top-1 h-3 w-3 rounded-full ring-4 ring-card',
                    m.done ? 'bg-primary' : 'border border-border bg-background'
                  )}
                />
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      !m.done && 'text-muted-foreground'
                    )}
                  >
                    {m.title}
                  </p>
                  <span className="text-xs text-muted-foreground">{m.date}</span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{m.detail}</p>
              </li>
            ))}
          </ol>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-medium">Top XP this month</h2>
          </div>

          <ul className="mt-5 divide-y divide-border/50">
            {leaderboard.slice(0, 6).map((e, i) => (
              <li key={e.id} className="flex items-center gap-3 py-3 first:pt-0">
                <span
                  className={cn(
                    'w-5 shrink-0 text-sm font-medium tabular-nums',
                    i === 0 ? 'text-warning' : 'text-muted-foreground'
                  )}
                >
                  {i + 1}
                </span>
                <img
                  src={e.avatar}
                  alt=""
                  className="h-8 w-8 shrink-0 rounded-full bg-secondary"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{e.name}</p>
                </div>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {compact(e.xp)}
                </span>
              </li>
            ))}
          </ul>

          <Button variant="ghost" size="sm" className="mt-4 w-full" asChild>
            <Link to="/app/leaderboard">Full leaderboard</Link>
          </Button>
        </Card>
      </div>
    </div>
  )
}
