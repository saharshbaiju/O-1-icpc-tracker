import { useMemo, useState } from 'react'
import {
  Activity,
  Database,
  Flag,
  MoreHorizontal,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserRound,
} from 'lucide-react'
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
import { StatCard } from '@/components/StatCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  adminReports,
  adminStats,
  adminUserRows,
  compact,
  contests,
  DIFFICULTIES,
  PLATFORMS,
  problems,
  ROLE_LABEL,
  sheets,
  signupTrend,
} from '@/lib/data'
import type { Role } from '@/lib/data'
import { cn } from '@/lib/utils'

const SYSTEM_ROWS = [
  { label: 'API', value: 'Operational', ok: true },
  { label: 'Judge sync workers', value: '4 / 4 healthy', ok: true },
  { label: 'Submission queue', value: '18 pending', ok: true },
  { label: 'Storage', value: `${adminStats.storage}% used`, ok: adminStats.storage < 80 },
  { label: 'Uptime (30d)', value: `${adminStats.uptime}%`, ok: true },
  { label: 'Editorial indexer', value: 'Degraded — retrying', ok: false },
]

const AUDIT_LOG = [
  { id: 'al-1', text: 'saharsh_b changed role of neel_trivedi to Mentor', time: '18m ago' },
  { id: 'al-2', text: 'System suspended account riya_sharma (spam)', time: '2h ago' },
  { id: 'al-3', text: 'aarav_mehta published editorial for Regionals Sim #4', time: '5h ago' },
  { id: 'al-4', text: 'Problem D1409 URL corrected', time: '1d ago' },
]

const SEVERITY_VARIANT = {
  high: 'destructive',
  medium: 'warning',
  low: 'secondary',
} as const

function AdminTooltip({
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
      <p className="text-sm font-medium">{payload[0]?.value} new users</p>
    </div>
  )
}

export default function Admin() {
  const { role } = useAuth()
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [addOpen, setAddOpen] = useState(false)

  const users = useMemo(() => {
    const q = query.trim().toLowerCase()
    return adminUserRows.filter((u) => {
      if (
        q &&
        !u.name.toLowerCase().includes(q) &&
        !u.handle.toLowerCase().includes(q) &&
        !u.email.toLowerCase().includes(q)
      )
        return false
      if (roleFilter !== 'all' && u.role !== roleFilter) return false
      return true
    })
  }, [query, roleFilter])

  if (role !== 'admin') {
    return (
      <div className="space-y-6">
        <PageHeader title="Admin Panel" />
        <Card className="flex flex-col items-center gap-4 py-24 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-3xl bg-destructive/15 text-destructive">
            <ShieldAlert className="h-7 w-7" />
          </span>
          <div>
            <p className="text-lg font-medium">Admin access required</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              You are signed in as{' '}
              <span className="text-foreground">{ROLE_LABEL[role]}</span>. This
              area manages users, content and platform analytics for the whole
              of O(1).
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Switch to the Admin role from the selector in the top bar to
              preview this panel.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  const allSelected = users.length > 0 && selectedIds.length === users.length

  function toggleAll() {
    setSelectedIds(allSelected ? [] : users.map((u) => u.id))
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Panel"
        description="Users, content, moderation reports and platform health for every team training on O(1)."
        actions={
          <Badge variant="default">
            <ShieldCheck className="h-3.5 w-3.5" /> Full access
          </Badge>
        }
      />

      {/* -------------------------------------------------- Stats */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total users" value={compact(adminStats.totalUsers)} delta={11} icon="Users" accent="primary" />
        <StatCard label="Active today" value={compact(adminStats.activeToday)} delta={6} icon="Activity" accent="lime" />
        <StatCard label="Problems" value={compact(adminStats.problems)} icon="Database" accent="chart-3" />
        <StatCard label="Contests" value={adminStats.contests} delta={4} icon="Swords" accent="chart-4" />
        <StatCard label="Sheets" value={adminStats.sheets} icon="ClipboardList" accent="primary" />
        <StatCard label="Open reports" value={adminStats.reports} delta={-22} icon="Flag" accent="warning" />
      </div>

      {/* -------------------------------------------------- Growth */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-medium">Platform growth</h2>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            New registrations per month
          </p>

          <div className="mt-6 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={signupTrend}
                margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
              >
                <defs>
                  <linearGradient id="adminSignupFill" x1="0" y1="0" x2="0" y2="1">
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
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                />
                <Tooltip content={<AdminTooltip />} cursor={false} />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#adminSignupFill)"
                  dot={false}
                
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-sm font-medium">Infrastructure</h2>
          <div className="mt-6 space-y-6">
            <div>
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-muted-foreground">Storage used</span>
                <span className="tabular-nums">{adminStats.storage}%</span>
              </div>
              <Progress
                value={adminStats.storage}
                className="mt-2.5"
                indicatorClassName={
                  adminStats.storage > 80 ? 'bg-destructive' : 'bg-primary'
                }
              />
            </div>
            <div>
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-muted-foreground">Uptime (30 days)</span>
                <span className="tabular-nums">{adminStats.uptime}%</span>
              </div>
              <Progress
                value={adminStats.uptime}
                className="mt-2.5"
                indicatorClassName="bg-success"
              />
            </div>
            <div className="rounded-2xl bg-secondary/40 px-4 py-3">
              <p className="text-sm">{compact(adminStats.activeToday)} active today</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {Math.round((adminStats.activeToday / adminStats.totalUsers) * 100)}%
                of registered users
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* -------------------------------------------------- Tabs */}
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* ------------------------------------------ Users */}
        <TabsContent value="users">
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search users…"
                    className="h-10 w-[240px] pl-10"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    {(['student', 'mentor', 'admin'] as Role[]).map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABEL[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {users.length} user{users.length === 1 ? '' : 's'}
                </span>
                <Button variant="outline" size="sm">
                  Export CSV
                </Button>
              </div>
            </div>

            {selectedIds.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3">
                <span className="text-sm font-medium">
                  {selectedIds.length} selected
                </span>
                <Button variant="secondary" size="sm">
                  Change role
                </Button>
                <Button variant="secondary" size="sm">
                  Suspend
                </Button>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={() => setSelectedIds([])}
                >
                  Clear
                </Button>
              </div>
            )}

            <div className="mt-5">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={toggleAll}
                        aria-label="Select all users"
                      />
                    </TableHead>
                    <TableHead>Coder</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Last active</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(u.id)}
                          onCheckedChange={() => toggleOne(u.id)}
                          aria-label={`Select ${u.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <img
                            src={u.avatar}
                            alt=""
                            className="h-8 w-8 shrink-0 rounded-full bg-secondary"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{u.name}</p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              @{u.handle}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.email}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            u.role === 'admin'
                              ? 'destructive'
                              : u.role === 'mentor'
                                ? 'default'
                                : 'secondary'
                          }
                        >
                          {ROLE_LABEL[u.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            u.status === 'active'
                              ? 'success'
                              : u.status === 'pending'
                                ? 'warning'
                                : 'destructive'
                          }
                        >
                          {u.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="tabular-nums">{u.rating}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {u.lastActive}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Actions for ${u.name}`}
                            >
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <UserRound className="h-4 w-4" /> View profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>Change role</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Suspend</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                              <Trash2 className="h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* ------------------------------------------ Content */}
        <TabsContent value="content">
          <div className="grid gap-5 lg:grid-cols-3">
            {[
              { title: 'Problems', count: adminStats.problems, items: problems.slice(0, 4).map((p) => p.title) },
              { title: 'Contests', count: adminStats.contests, items: contests.slice(0, 4).map((c) => c.name) },
              { title: 'Sheets', count: adminStats.sheets, items: sheets.slice(0, 4).map((s) => s.title) },
            ].map((group) => (
              <Card key={group.title} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-medium">{group.title}</h2>
                  </div>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {compact(group.count)}
                  </span>
                </div>

                <ul className="mt-5 divide-y divide-border/50">
                  {group.items.map((i) => (
                    <li key={i} className="truncate py-2.5 text-sm">
                      {i}
                    </li>
                  ))}
                </ul>

                <div className="mt-5 flex gap-2">
                  <Button variant="secondary" size="sm" className="flex-1">
                    Manage
                  </Button>
                  {group.title === 'Problems' && (
                    <Button size="sm" onClick={() => setAddOpen(true)}>
                      <Plus className="h-4 w-4" /> Add
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ------------------------------------------ Reports */}
        <TabsContent value="reports">
          <Card className="p-6">
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-medium">Moderation reports</h2>
            </div>

            <div className="mt-5">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Reported</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminReports.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm font-medium">
                        {r.subject}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.reporter}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {r.target}
                      </TableCell>
                      <TableCell>
                        <Badge variant={SEVERITY_VARIANT[r.severity]}>
                          {r.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {r.time}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="secondary">
                            Resolve
                          </Button>
                          <Button size="sm" variant="ghost">
                            Dismiss
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* ------------------------------------------ System */}
        <TabsContent value="system">
          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="p-6">
              <h2 className="text-sm font-medium">Service status</h2>
              <ul className="mt-5 divide-y divide-border/50">
                {SYSTEM_ROWS.map((s) => (
                  <li
                    key={s.label}
                    className="flex items-center justify-between gap-3 py-3.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full',
                          s.ok ? 'bg-success' : 'bg-warning'
                        )}
                      />
                      <span className="text-sm">{s.label}</span>
                    </div>
                    <span
                      className={cn(
                        'text-sm',
                        s.ok ? 'text-muted-foreground' : 'text-warning'
                      )}
                    >
                      {s.value}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-6">
              <h2 className="text-sm font-medium">Recent admin audit log</h2>
              <ul className="mt-5 divide-y divide-border/50">
                {AUDIT_LOG.map((a) => (
                  <li key={a.id} className="py-3.5">
                    <p className="text-sm">{a.text}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{a.time}</p>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* -------------------------------------------------- Add problem */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a problem</DialogTitle>
            <DialogDescription>
              New problems appear in the repository immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="p-title">Title</Label>
              <Input id="p-title" placeholder="e.g. Minimum Spanning Subgraph" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Platform</Label>
                <Select defaultValue={PLATFORMS[0]}>
                  <SelectTrigger>
                    <SelectValue placeholder="Platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Difficulty</Label>
                <Select defaultValue="Medium">
                  <SelectTrigger>
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="p-rating">Rating</Label>
                <Input id="p-rating" type="number" defaultValue={1600} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="p-topics">Topics</Label>
                <Input id="p-topics" placeholder="Graphs, Trees" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="p-url">Problem URL</Label>
              <Input id="p-url" placeholder="https://…" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setAddOpen(false)}>Add problem</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
