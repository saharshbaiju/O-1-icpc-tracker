import { useMemo, useState } from 'react'
import {
  AtSign,
  Bell,
  BellOff,
  CalendarDays,
  Check,
  ClipboardList,
  Medal,
  Server,
  Settings2,
  Swords,
  Trash2,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { calendarEvents, notifications as seed } from '@/lib/data'
import type { Notification } from '@/lib/data'
import { cn } from '@/lib/utils'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'contest', label: 'Contests' },
  { key: 'assignment', label: 'Assignments' },
  { key: 'mention', label: 'Mentions' },
  { key: 'achievement', label: 'Achievements' },
  { key: 'team', label: 'Team' },
  { key: 'system', label: 'System' },
] as const

const TYPE_META: Record<
  Notification['type'],
  { icon: typeof Swords; tile: string }
> = {
  contest: { icon: Swords, tile: 'bg-primary/15 text-primary' },
  assignment: { icon: ClipboardList, tile: 'bg-chart-3/15 text-chart-3' },
  mention: { icon: AtSign, tile: 'bg-chart-4/15 text-chart-4' },
  achievement: { icon: Medal, tile: 'bg-lime/15 text-lime' },
  team: { icon: Users, tile: 'bg-warning/15 text-warning' },
  system: { icon: Server, tile: 'bg-secondary text-muted-foreground' },
}

const QUICK_SETTINGS = [
  { id: 'qs-1', label: 'Email notifications', detail: 'Daily summary and urgent alerts', on: true },
  { id: 'qs-2', label: 'Push notifications', detail: 'Browser and mobile push', on: true },
  { id: 'qs-3', label: 'Contest reminders', detail: '30 minutes before a round', on: true },
  { id: 'qs-4', label: 'Mentor feedback', detail: 'Replies on your submissions', on: false },
]

/** "12m ago" / "3h ago" are today; anything in days is older. */
function isToday(time: string) {
  return time.includes('m ago') || time.includes('h ago')
}

export default function Notifications() {
  const [items, setItems] = useState<Notification[]>(seed)
  const [filter, setFilter] = useState<string>('all')
  const [quick, setQuick] = useState(QUICK_SETTINGS)

  const unreadCount = items.filter((n) => !n.read).length

  const visible = useMemo(() => {
    if (filter === 'all') return items
    if (filter === 'unread') return items.filter((n) => !n.read)
    return items.filter((n) => n.type === filter)
  }, [items, filter])

  const today = visible.filter((n) => isToday(n.time))
  const earlier = visible.filter((n) => !isToday(n.time))

  function markAll() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  function markRead(id: string) {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((n) => n.id !== id))
  }

  function toggleQuick(id: string) {
    setQuick((prev) =>
      prev.map((q) => (q.id === id ? { ...q, on: !q.on } : q))
    )
  }

  function Row({ n }: { n: Notification }) {
    const meta = TYPE_META[n.type]
    const Icon = meta.icon
    return (
      <li
        className={cn(
          'group flex items-start gap-3 rounded-2xl px-4 py-4 transition-colors hover:bg-secondary/40',
          !n.read && 'border-l-2 border-primary bg-primary/5'
        )}
      >
        <span
          className={cn(
            'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
            meta.tile
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <p className="flex-1 text-sm font-medium leading-snug">{n.title}</p>
            {!n.read && (
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>

          <div className="mt-2 flex items-center gap-3">
            <span className="text-[11px] text-muted-foreground">{n.time}</span>
            <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              {!n.read && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[11px]"
                  onClick={() => markRead(n.id)}
                >
                  <Check className="h-3 w-3" /> Mark read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[11px] text-destructive hover:text-destructive"
                onClick={() => remove(n.id)}
              >
                <Trash2 className="h-3 w-3" /> Delete
              </Button>
            </div>
          </div>
        </div>
      </li>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Contest starts, assignment deadlines, mentor replies and achievement unlocks — everything the platform wants you to know."
        actions={
          <>
            <Button variant="outline" size="pill" onClick={markAll}>
              <Check className="h-4 w-4" /> Mark all as read
            </Button>
            <Button variant="secondary" size="icon" className="rounded-full" asChild>
              <Link to="/app/settings" aria-label="Notification settings">
                <Settings2 />
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {/* -------------------------------------------- Filters */}
          <Card className="p-4">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => {
                const count =
                  f.key === 'all'
                    ? items.length
                    : f.key === 'unread'
                      ? unreadCount
                      : null
                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={cn(
                      'rounded-full border border-border/70 px-4 py-1.5 text-xs transition-colors',
                      filter === f.key
                        ? 'border-transparent bg-foreground font-medium text-background'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {f.label}
                    {count !== null && ` · ${count}`}
                  </button>
                )
              })}
            </div>
          </Card>

          {/* -------------------------------------------- List */}
          {visible.length === 0 ? (
            <Card className="flex flex-col items-center gap-3 py-20 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-muted-foreground">
                <BellOff className="h-6 w-6" />
              </span>
              <p className="text-sm font-medium">You're all caught up</p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Nothing matches this filter right now.
              </p>
              <Button variant="secondary" size="sm" onClick={() => setFilter('all')}>
                Show everything
              </Button>
            </Card>
          ) : (
            <Card className="p-2">
              {today.length > 0 && (
                <>
                  <p className="px-4 pb-1 pt-4 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Today
                  </p>
                  <ul className="space-y-1">
                    {today.map((n) => (
                      <Row key={n.id} n={n} />
                    ))}
                  </ul>
                </>
              )}

              {earlier.length > 0 && (
                <>
                  <p className="px-4 pb-1 pt-5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Earlier
                  </p>
                  <ul className="space-y-1 pb-2">
                    {earlier.map((n) => (
                      <Row key={n.id} n={n} />
                    ))}
                  </ul>
                </>
              )}
            </Card>
          )}
        </div>

        {/* ---------------------------------------------- Right rail */}
        <div className="space-y-5">
          <Card className="p-6">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-medium">Quick settings</h2>
            </div>
            <ul className="mt-4 divide-y divide-border/50">
              {quick.map((q) => (
                <li key={q.id} className="flex items-center gap-3 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{q.label}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {q.detail}
                    </p>
                  </div>
                  <Switch checked={q.on} onCheckedChange={() => toggleQuick(q.id)} />
                </li>
              ))}
            </ul>
            <Button variant="ghost" size="sm" className="mt-3 w-full" asChild>
              <Link to="/app/settings">All notification settings</Link>
            </Button>
          </Card>

          <Card className="p-6">
            <h2 className="text-sm font-medium">Weekly digest</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              A summary of solved problems, rating changes and upcoming deadlines,
              delivered to your inbox.
            </p>
            <div className="mt-4">
              <Select defaultValue="weekly">
                <SelectTrigger>
                  <SelectValue placeholder="Frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Badge variant="secondary" className="mt-4">
              Next digest: Monday 09:00
            </Badge>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-medium">Upcoming reminders</h2>
            </div>
            <ul className="mt-4 divide-y divide-border/50">
              {calendarEvents.slice(0, 3).map((e) => (
                <li key={e.id} className="py-3">
                  <p className="truncate text-sm">{e.title}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {new Date(`${e.date}T00:00:00`).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                    })}{' '}
                    · {e.time}
                  </p>
                </li>
              ))}
            </ul>
            <Button variant="ghost" size="sm" className="mt-3 w-full" asChild>
              <Link to="/app/calendar">Open calendar</Link>
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
