import { useMemo, useState } from 'react'
import {
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
} from 'lucide-react'

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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { calendarEvents, formatDuration } from '@/lib/data'
import type { CalendarEvent } from '@/lib/data'
import { cn } from '@/lib/utils'

const TODAY = '2026-07-26'
const VIEWS = ['Month', 'Week', 'Agenda'] as const
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const TYPE_STYLE: Record<
  CalendarEvent['type'],
  { chip: string; dot: string; label: string }
> = {
  contest: { chip: 'bg-foreground text-background', dot: 'bg-foreground', label: 'Contest' },
  practice: { chip: 'border border-border bg-card text-foreground', dot: 'bg-chart-3', label: 'Practice' },
  deadline: { chip: 'bg-chart-2 text-background', dot: 'bg-chart-2', label: 'Deadline' },
  session: { chip: 'bg-secondary text-foreground', dot: 'bg-chart-4', label: 'Session' },
  announcement: { chip: 'border border-dashed border-foreground bg-card text-foreground', dot: 'bg-chart-5', label: 'Announcement' },
}

const REMINDERS = [
  { id: 'rm-1', title: 'Contest starting soon', detail: '30 minutes before any registered round', on: true },
  { id: 'rm-2', title: 'Assignment due', detail: 'One day before a sheet deadline', on: true },
  { id: 'rm-3', title: 'Mentor session', detail: 'At the scheduled start time', on: false },
  { id: 'rm-4', title: 'Weekly digest', detail: 'Every Monday at 09:00', on: true },
]

/** July 2026 starts on a Wednesday and has 31 days. */
const MONTH_START_OFFSET = 2
const DAYS_IN_MONTH = 31

export default function Calendar() {
  const [view, setView] = useState<(typeof VIEWS)[number]>('Month')
  const [selected, setSelected] = useState(TODAY)
  const [addOpen, setAddOpen] = useState(false)
  const [reminders, setReminders] = useState(REMINDERS)

  const byDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {}
    for (const e of calendarEvents) {
      ;(map[e.date] ??= []).push(e)
    }
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => a.time.localeCompare(b.time))
    }
    return map
  }, [])

  const selectedEvents = byDate[selected] ?? []

  const upcoming = useMemo(
    () =>
      [...calendarEvents]
        .filter((e) => e.date >= TODAY)
        .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
        .slice(0, 5),
    []
  )

  const weekAtAGlance = useMemo(() => {
    const out: { label: string; date: string; count: number }[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(`${TODAY}T00:00:00`)
      d.setDate(d.getDate() + i)
      const iso = d.toISOString().slice(0, 10)
      out.push({
        label: d.toLocaleDateString('en-GB', { weekday: 'short' }),
        date: iso,
        count: (byDate[iso] ?? []).length,
      })
    }
    return out
  }, [byDate])

  function dateFor(day: number) {
    return `2026-07-${String(day).padStart(2, '0')}`
  }

  function toggleReminder(id: string) {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, on: !r.on } : r))
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        description="Contest schedules, practice sessions, assignment deadlines and announcements on a single timeline."
        actions={
          <>
            <div className="inline-flex items-center gap-1 rounded-full bg-card p-1">
              {VIEWS.map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-xs transition-colors',
                    view === v
                      ? 'bg-foreground font-medium text-background'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
            <Button size="pill" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" /> Add event
            </Button>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        {/* ---------------------------------------------- Month grid */}
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-foreground" />
              <h2 className="paper-label text-muted-foreground">July 2026</h2>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" aria-label="Previous month">
                <ChevronLeft />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelected(TODAY)}>
                Today
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Next month">
                <ChevronRight />
              </Button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-7 gap-1.5">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="pb-2 text-center text-[11px] font-medium text-muted-foreground"
              >
                {d}
              </div>
            ))}

            {Array.from({ length: MONTH_START_OFFSET }).map((_, i) => (
              <div key={`blank-${i}`} />
            ))}

            {Array.from({ length: DAYS_IN_MONTH }).map((_, i) => {
              const day = i + 1
              const iso = dateFor(day)
              const events = byDate[iso] ?? []
              const isToday = iso === TODAY
              const isSelected = iso === selected

              return (
                <button
                  key={iso}
                  onClick={() => setSelected(iso)}
                  className={cn(
                    'min-h-[92px] rounded-lg border border-border p-2 text-left transition-colors hover:bg-secondary',
                    isToday && 'border-foreground bg-foreground text-background hover:bg-foreground',
                    isSelected && !isToday && 'bg-secondary'
                  )}
                >
                  <span
                    className={cn(
                      'text-xs tabular-nums',
                      isToday ? 'font-medium text-background' : 'text-muted-foreground'
                    )}
                  >
                    {day}
                  </span>

                  <div className="mt-1.5 space-y-1">
                    {events.slice(0, 2).map((e) => (
                      <div
                        key={e.id}
                        className={cn(
                          'truncate rounded-md px-1.5 py-0.5 text-[10px] leading-tight',
                          TYPE_STYLE[e.type].chip
                        )}
                        title={e.title}
                      >
                        {e.title}
                      </div>
                    ))}
                    {events.length > 2 && (
                      <p className="px-1.5 text-[10px] text-muted-foreground">
                        +{events.length - 2} more
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4 pt-4">
            {Object.entries(TYPE_STYLE).map(([key, s]) => (
              <span
                key={key}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <span className={cn('h-2 w-2 rounded-full', s.dot)} />
                {s.label}
              </span>
            ))}
          </div>
        </Card>

        {/* ---------------------------------------------- Right rail */}
        <div className="space-y-5">
          <Card className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-foreground" />
              <h2 className="paper-label text-muted-foreground">
                {new Date(`${selected}T00:00:00`).toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </h2>
            </div>

            {selectedEvents.length === 0 ? (
              <p className="mt-5 text-sm text-muted-foreground">
                Nothing scheduled. A good day for a virtual round.
              </p>
            ) : (
              <ul className="mt-5">
                {selectedEvents.map((e) => (
                  <li key={e.id} className="py-3 first:pt-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{e.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {e.time}
                          {e.durationMins > 0 &&
                            ` · ${formatDuration(e.durationMins)}`}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn('shrink-0', TYPE_STYLE[e.type].chip)}
                      >
                        {TYPE_STYLE[e.type].label}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-foreground" />
              <h2 className="paper-label text-muted-foreground">Upcoming</h2>
            </div>
            <ul className="mt-5 space-y-3">
              {upcoming.map((e) => (
                <li
                  key={e.id}
                  className={cn(
                    'rounded-xl bg-secondary px-3 py-2.5'
                  )}
                >
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
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-foreground" />
              <h2 className="paper-label text-muted-foreground">Reminders</h2>
            </div>
            <ul className="mt-4">
              {reminders.map((r) => (
                <li key={r.id} className="flex items-center gap-3 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{r.title}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {r.detail}
                    </p>
                  </div>
                  <Switch
                    checked={r.on}
                    onCheckedChange={() => toggleReminder(r.id)}
                  />
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {/* ---------------------------------------------- Week strip */}
      <Card className="p-6">
        <h2 className="paper-label text-muted-foreground">This week at a glance</h2>
        <div className="mt-5 grid grid-cols-4 gap-3 sm:grid-cols-7">
          {weekAtAGlance.map((d) => (
            <button
              key={d.date}
              onClick={() => setSelected(d.date)}
              className={cn(
                'rounded-lg border border-border p-4 text-left transition-colors hover:bg-secondary',
                selected === d.date && 'bg-secondary'
              )}
            >
              <p className="text-xs text-muted-foreground">{d.label}</p>
              <p className="mt-1 text-lg font-medium tabular-nums">
                {Number(d.date.slice(-2))}
              </p>
              <div
                className={cn(
                  'mt-3 h-1 rounded-full',
                  d.count > 0 ? 'bg-foreground' : 'bg-border'
                )}
                style={{ width: `${Math.min(100, 25 + d.count * 25)}%` }}
              />
              <p className="mt-2 text-[11px] text-muted-foreground">
                {d.count} event{d.count === 1 ? '' : 's'}
              </p>
            </button>
          ))}
        </div>
      </Card>

      {/* ---------------------------------------------- Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add an event</DialogTitle>
            <DialogDescription>
              Blocks show on your calendar and can trigger reminders.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="ev-title">Title</Label>
              <Input id="ev-title" placeholder="e.g. Team practice — Flows" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select defaultValue="practice">
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_STYLE).map(([key, s]) => (
                      <SelectItem key={key} value={key}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ev-date">Date</Label>
                <Input id="ev-date" type="date" defaultValue={selected} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="ev-time">Start time</Label>
                <Input id="ev-time" type="time" defaultValue="20:00" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ev-dur">Duration (minutes)</Label>
                <Input id="ev-dur" type="number" defaultValue={120} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setAddOpen(false)}>Add event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
