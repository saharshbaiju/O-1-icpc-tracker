import { useState } from 'react'
import {
  Check,
  Copy,
  Crown,
  KeyRound,
  Link2,
  MoreHorizontal,
  Plus,
  Radar as RadarIcon,
  Trophy,
  UserMinus,
  UserRound,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts'

import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'
import {
  myTeam,
  resources,
  teams,
  topicMastery,
} from '@/lib/data'

const TEAM_ACTIVITY = [
  { id: 'ta-1', text: 'Ananya Ghosh solved Convex Hull Trick', meta: 'Codeforces · 2300', time: '32m ago' },
  { id: 'ta-2', text: 'Team registered for Mock Round 7', meta: '11 problems · 5 hours', time: '3h ago' },
  { id: 'ta-3', text: 'Rohan pushed a new flows template', meta: 'Shared library', time: '1d ago' },
  { id: 'ta-4', text: 'Placed 3rd in Team Relay — Round 3', meta: '8 / 9 solved', time: '2w ago' },
  { id: 'ta-5', text: 'Coach added a geometry checklist', meta: 'Prof. R. Subramanian', time: '3w ago' },
]

const RADAR_DATA = topicMastery.slice(0, 7).map((t) => ({
  topic: t.topic.length > 12 ? `${t.topic.slice(0, 11)}…` : t.topic,
  team: Math.min(100, t.mastery + 9),
}))

export default function Teams() {
  const { role } = useAuth()
  const [joinOpen, setJoinOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const weakest = [...topicMastery].sort((a, b) => a.mastery - b.mastery).slice(0, 2)

  function copyInvite() {
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teams"
        description="Build a three-person squad, track combined topic coverage, and keep shared notes and practice plans in one place."
        actions={
          <>
            <Button variant="outline" size="pill" onClick={() => setJoinOpen(true)}>
              <KeyRound className="h-4 w-4" /> Join with code
            </Button>
            <Button size="pill" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> Create team
            </Button>
          </>
        }
      />

      {/* -------------------------------------------------- My team hero */}
      <Card className="relative overflow-hidden p-8">
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default">
                  <Trophy className="h-3.5 w-3.5" /> Rank #{myTeam.rank} nationally
                </Badge>
                <Badge variant="secondary">Since {myTeam.createdAt}</Badge>
              </div>
              <h2
                className="font-display mt-4 text-4xl"
              >
                {myTeam.name}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {myTeam.university} · Coached by {myTeam.coach}
              </p>
            </div>

            <Button variant="secondary" size="pill" asChild>
              <Link to="/app/calendar">Schedule a practice round</Link>
            </Button>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
            {[
              { label: 'National rank', value: `#${myTeam.rank}` },
              { label: 'Team rating', value: myTeam.rating },
              { label: 'Contests', value: myTeam.contests },
              { label: 'Problems solved', value: myTeam.solved },
            ].map((s) => (
              <div key={s.label} className="bg-card px-5 py-4">
                <p className="text-2xl font-medium tabular-nums tracking-tight">
                  {s.value}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {myTeam.members.map((m, i) => (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
              >
                <div className="relative">
                  <img
                    src={m.avatar}
                    alt=""
                    className="h-11 w-11 rounded-full bg-secondary"
                  />
                  {i === 0 && (
                    <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-foreground text-background">
                      <Crown className="h-3 w-3" />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {m.role}
                  </p>
                  <p
                    className="mt-0.5 text-xs font-medium tabular-nums text-foreground"
                  >
                    {m.rating}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Actions for ${m.name}`}
                    >
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <a
                        href={`https://codeforces.com/profile/${m.handle}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <UserRound className="h-4 w-4" /> Codeforces profile
                      </a>
                    </DropdownMenuItem>
                    {role !== 'student' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-foreground">
                          <UserMinus className="h-4 w-4" /> Remove from team
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* -------------------------------------------------- Coverage + invite */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center gap-2">
            <RadarIcon className="h-4 w-4 text-foreground" />
            <h2 className="paper-label text-muted-foreground">Team topic coverage</h2>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Combined strength across the three of you.
          </p>

          <div className="mt-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={RADAR_DATA} outerRadius="72%">
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="topic"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                />
                <PolarRadiusAxis
                  domain={[0, 100]}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  axisLine={false}
                />
                <Radar
                  dataKey="team"
                  stroke="hsl(var(--foreground))"
                  fill="hsl(var(--foreground))"
                  fillOpacity={0.28}
                  strokeWidth={2}
                
                  isAnimationActive={false}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 rounded-lg border border-border bg-secondary px-4 py-3">
            <p className="text-sm">
              Weakest areas:{' '}
              <span className="font-medium">
                {weakest.map((w) => w.topic).join(' and ')}
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              No member is above 30% here. Assign a shared sheet before the
              regional.
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-foreground" />
            <h2 className="paper-label text-muted-foreground">Invite a teammate</h2>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Share this link — it expires in 7 days.
          </p>

          <div className="mt-5 flex gap-2">
            <Input
              readOnly
              value="o1.dev/join/SEGF-4417"
              className="font-mono text-xs"
            />
            <Button variant="secondary" size="icon" onClick={copyInvite}>
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          {copied && (
            <p className="mt-2 text-xs text-muted-foreground">Copied to clipboard</p>
          )}

          <div className="mt-6 pt-5">
            <h3 className="text-xs font-medium text-muted-foreground">
              Shared resources
            </h3>
            <ul className="mt-3">
              {resources.slice(0, 4).map((r) => (
                <li key={r.id} className="py-2.5">
                  <p className="truncate text-sm">{r.title}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {r.type} · {r.author}
                  </p>
                </li>
              ))}
            </ul>
            <Button variant="ghost" size="sm" className="mt-3 w-full" asChild>
              <Link to="/app/resources">Open shared library</Link>
            </Button>
          </div>
        </Card>
      </div>

      {/* -------------------------------------------------- Activity */}
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-foreground" />
          <h2 className="paper-label text-muted-foreground">Team activity</h2>
        </div>
        <ul className="mt-5">
          {TEAM_ACTIVITY.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center gap-3 py-3 first:pt-0"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{a.text}</p>
                <p className="truncate text-xs text-muted-foreground">{a.meta}</p>
              </div>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {a.time}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {/* -------------------------------------------------- Browse teams */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="paper-label text-muted-foreground">Browse teams</h2>
          <span className="text-xs text-muted-foreground">
            {teams.length - 1} teams recruiting
          </span>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {teams
            .filter((t) => t.id !== myTeam.id)
            .map((t) => (
              <Card key={t.id} className="flex flex-col p-6">
                <div className="flex items-center justify-between">
                  <Badge variant={t.rank <= 3 ? 'default' : 'outline'}>
                    Rank #{t.rank}
                  </Badge>
                  <span className="text-sm font-medium tabular-nums">
                    {t.rating}
                  </span>
                </div>

                <h3 className="mt-4 text-base font-medium tracking-tight">
                  {t.name}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.university}
                </p>

                <div className="mt-5 flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {t.members.map((m) => (
                      <img
                        key={m.id}
                        src={m.avatar}
                        alt=""
                        title={m.name}
                        className="h-8 w-8 rounded-full bg-secondary ring-2 ring-card"
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {t.contests} contests
                  </span>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-6 w-full"
                  onClick={() => setJoinOpen(true)}
                >
                  Request to join
                </Button>
              </Card>
            ))}
        </div>
      </div>

      {/* -------------------------------------------------- Dialogs */}
      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Join a team</DialogTitle>
            <DialogDescription>
              Enter the invite code your captain shared with you.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="join-code">Invite code</Label>
            <Input
              id="join-code"
              placeholder="SEGF-4417"
              className="font-mono"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setJoinOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setJoinOpen(false)}>Join team</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create a team</DialogTitle>
            <DialogDescription>
              ICPC teams are three people plus a coach.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="team-name">Team name</Label>
              <Input id="team-name" placeholder="e.g. Amortized Chaos" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="team-uni">University</Label>
              <Input id="team-uni" defaultValue={myTeam.university} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="team-coach">Coach</Label>
              <Input id="team-coach" placeholder="Faculty advisor" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setCreateOpen(false)}>Create team</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
