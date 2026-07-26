import { useMemo, useState } from 'react'
import {
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Phone,
  Search,
  Send,
  Smile,
  UserRound,
  Video,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { conversations, sampleThread } from '@/lib/data'
import type { Message } from '@/lib/data'
import { cn } from '@/lib/utils'

const FILTERS = ['All', 'Direct', 'Team', 'Mentors'] as const

export default function Messages() {
  const [selected, setSelected] = useState<string | null>(conversations[1].id)
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All')
  const [query, setQuery] = useState('')
  const [thread, setThread] = useState<Message[]>(sampleThread)
  const [draft, setDraft] = useState('')

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return conversations.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q)) return false
      if (filter === 'Direct' && c.type !== 'direct') return false
      if (filter === 'Team' && c.type !== 'team') return false
      if (filter === 'Mentors' && c.type !== 'mentor') return false
      return true
    })
  }, [query, filter])

  const active = conversations.find((c) => c.id === selected) ?? null

  function send() {
    const text = draft.trim()
    if (!text) return
    setThread((prev) => [
      ...prev,
      {
        id: `m-${prev.length + 1}`,
        from: 'me',
        text,
        time: '10:42',
      },
    ])
    setDraft('')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        description="Direct messages, mentor feedback, and your team channel — all in one thread list."
        actions={
          <Button size="pill">
            <MessageSquare className="h-4 w-4" /> New message
          </Button>
        }
      />

      <div className="grid gap-5 lg:h-[calc(100vh-16rem)] lg:grid-cols-[330px_1fr]">
        {/* ---------------------------------------------- Conversations */}
        <Card className="flex min-h-0 flex-col p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search conversations…"
              className="h-10 pl-10"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs transition-colors',
                  filter === f
                    ? 'bg-foreground font-medium text-background'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {f}
              </button>
            ))}
          </div>

          <ul className="scroll-slim mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto">
            {list.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setSelected(c.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors',
                    selected === c.id
                      ? 'bg-secondary/60'
                      : 'hover:bg-secondary/40'
                  )}
                >
                  <div className="relative shrink-0">
                    <img
                      src={c.avatar}
                      alt=""
                      className="h-10 w-10 rounded-full bg-secondary"
                    />
                    {c.online && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-card" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-medium">{c.name}</p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {c.time}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <p className="truncate text-xs text-muted-foreground">
                        {c.lastMessage}
                      </p>
                      {c.unread > 0 && (
                        <Badge className="h-4 min-w-4 shrink-0 justify-center px-1 text-[10px]">
                          {c.unread}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        {/* ---------------------------------------------- Thread */}
        {active ? (
          <Card className="flex min-h-0 flex-col">
            <div className="flex items-center gap-3 border-b border-border/60 p-5">
              <div className="relative shrink-0">
                <img
                  src={active.avatar}
                  alt=""
                  className="h-10 w-10 rounded-full bg-secondary"
                />
                {active.online && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-card" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{active.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  @{active.handle} · {active.online ? 'Online now' : 'Offline'}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon-sm" aria-label="Voice call">
                  <Phone />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label="Video call">
                  <Video />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label="More">
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to={`/app/profile/${active.handle}`}>
                        <UserRound className="h-4 w-4" /> View profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>Mute conversation</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:text-destructive">
                      Block
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="scroll-slim min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
              <div className="flex justify-center">
                <span className="rounded-full bg-secondary px-3 py-1 text-[11px] text-muted-foreground">
                  Today
                </span>
              </div>

              {thread.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    'flex',
                    m.from === 'me' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div className="max-w-[75%]">
                    <div
                      className={cn(
                        'px-4 py-2.5 text-sm leading-relaxed',
                        m.from === 'me'
                          ? 'rounded-2xl rounded-br-md bg-primary text-primary-foreground'
                          : 'rounded-2xl rounded-bl-md bg-secondary'
                      )}
                    >
                      {m.text}
                    </div>
                    <p
                      className={cn(
                        'mt-1 text-[11px] text-muted-foreground',
                        m.from === 'me' ? 'text-right' : 'text-left'
                      )}
                    >
                      {m.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border/60 p-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" aria-label="Attach file">
                  <Paperclip />
                </Button>
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      send()
                    }
                  }}
                  placeholder={`Message ${active.name}…`}
                  className="flex-1 rounded-full"
                />
                <Button variant="ghost" size="icon" aria-label="Add emoji">
                  <Smile />
                </Button>
                <Button
                  size="icon"
                  className="rounded-full"
                  onClick={send}
                  disabled={!draft.trim()}
                  aria-label="Send message"
                >
                  <Send />
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="grid place-items-center p-10 text-center">
            <div>
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-muted-foreground">
                <MessageSquare className="h-6 w-6" />
              </span>
              <p className="mt-4 text-sm font-medium">No conversation selected</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Pick a thread on the left to start reading.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
