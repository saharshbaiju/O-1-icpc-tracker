import { useState } from 'react'
import {
  Bell,
  Check,
  Eye,
  Link2,
  Lock,
  Palette,
  RefreshCw,
  ShieldAlert,
  Trash2,
  UserRound,
} from 'lucide-react'

import { GithubMark, GoogleMark } from '@/components/BrandIcons'
import { PageHeader } from '@/components/layout/PageHeader'
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
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/lib/auth'
import { currentUser } from '@/lib/data'
import { cn } from '@/lib/utils'

const SECTIONS = [
  { key: 'profile', label: 'Profile', icon: UserRound },
  { key: 'account', label: 'Account', icon: Lock },
  { key: 'connections', label: 'Connected accounts', icon: Link2 },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'appearance', label: 'Appearance', icon: Palette },
  { key: 'privacy', label: 'Privacy', icon: Eye },
  { key: 'danger', label: 'Danger zone', icon: ShieldAlert },
] as const

type SectionKey = (typeof SECTIONS)[number]['key']

const SESSIONS = [
  { id: 'sx-1', device: 'Chrome · Arch Linux', location: 'Kochi, India', last: 'Active now', current: true },
  { id: 'sx-2', device: 'Safari · iPhone 16', location: 'Kochi, India', last: '2 hours ago', current: false },
  { id: 'sx-3', device: 'Firefox · Windows 11', location: 'Bengaluru, India', last: '6 days ago', current: false },
]

const NOTIFY_ROWS = [
  { key: 'contest', label: 'Contest reminders', detail: 'Before a round you registered for' },
  { key: 'deadline', label: 'Assignment deadlines', detail: 'When a sheet is nearly due' },
  { key: 'feedback', label: 'Mentor feedback', detail: 'Replies and code review on your submissions' },
  { key: 'team', label: 'Team activity', detail: 'Members joining, leaving or solving' },
  { key: 'mention', label: 'Mentions', detail: 'When someone @s you in a thread' },
  { key: 'digest', label: 'Weekly digest', detail: 'A summary of your week' },
  { key: 'product', label: 'Product updates', detail: 'New features on O(1)' },
]

const THEMES = [
  { key: 'dark', label: 'Dark', swatch: 'bg-[hsl(255_24%_4%)]' },
  { key: 'violet', label: 'Midnight violet', swatch: 'bg-[hsl(258_60%_12%)]' },
  { key: 'system', label: 'System', swatch: 'bg-gradient-to-br from-[hsl(255_24%_4%)] to-[hsl(0_0%_85%)]' },
]

const CONNECTIONS = [
  'Codeforces',
  'CodeChef',
  'LeetCode',
  'AtCoder',
  'GitHub',
  'Google',
]

const BIO_LIMIT = 280

export default function Settings() {
  const { user } = useAuth()
  const [section, setSection] = useState<SectionKey>('profile')
  const [saved, setSaved] = useState(false)
  const [bio, setBio] = useState(user?.bio ?? currentUser.bio)
  const [theme, setTheme] = useState('dark')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [channels, setChannels] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(NOTIFY_ROWS.map((r) => [r.key, ['email', 'inapp']]))
  )

  const linked = new Set((user?.platforms ?? currentUser.platforms).map((p) => p.platform as string))

  function save() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function toggleChannel(row: string, channel: string) {
    setChannels((prev) => {
      const cur = prev[row] ?? []
      return {
        ...prev,
        [row]: cur.includes(channel)
          ? cur.filter((c) => c !== channel)
          : [...cur, channel],
      }
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your profile, linked judge accounts, notifications and privacy."
        actions={
          <Button size="pill" onClick={save} variant={saved ? 'secondary' : 'default'}>
            {saved ? (
              <>
                <Check className="h-4 w-4 text-success" /> Saved
              </>
            ) : (
              'Save changes'
            )}
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[230px_1fr]">
        {/* ---------------------------------------------- Section nav */}
        <Card className="h-fit p-3">
          <nav className="space-y-1">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => setSection(s.key)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-full px-3.5 py-2.5 text-sm transition-colors',
                  section === s.key
                    ? 'bg-foreground font-medium text-background'
                    : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                  s.key === 'danger' && section !== s.key && 'text-destructive/80'
                )}
              >
                <s.icon className="h-[18px] w-[18px]" />
                {s.label}
              </button>
            ))}
          </nav>
        </Card>

        {/* ---------------------------------------------- Panes */}
        <div className="space-y-5">
          {section === 'profile' && (
            <Card className="p-6">
              <div className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-medium">Profile</h2>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <img
                  src={user?.avatar}
                  alt=""
                  className="h-20 w-20 rounded-full bg-secondary"
                />
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm">
                    Change photo
                  </Button>
                  <Button variant="ghost" size="sm">
                    Remove
                  </Button>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="s-name">Full name</Label>
                  <Input id="s-name" defaultValue={user?.name} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="s-handle">Handle</Label>
                  <Input id="s-handle" defaultValue={user?.handle} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="s-email">Email</Label>
                  <Input id="s-email" type="email" defaultValue={user?.email} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="s-college">College</Label>
                  <Input id="s-college" defaultValue={user?.college} />
                </div>
                <div className="grid gap-2">
                  <Label>Year</Label>
                  <Select defaultValue={user?.year}>
                    <SelectTrigger>
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate'].map(
                        (y) => (
                          <SelectItem key={y} value={y}>
                            {y}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Country</Label>
                  <Select defaultValue={user?.country}>
                    <SelectTrigger>
                      <SelectValue placeholder="Country" />
                    </SelectTrigger>
                    <SelectContent>
                      {['India', 'Singapore', 'Japan', 'Germany', 'United States'].map(
                        (c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 grid gap-2">
                <Label htmlFor="s-bio">Bio</Label>
                <Textarea
                  id="s-bio"
                  rows={3}
                  value={bio}
                  maxLength={BIO_LIMIT}
                  onChange={(e) => setBio(e.target.value)}
                />
                <p
                  className={cn(
                    'text-right text-xs',
                    bio.length > BIO_LIMIT - 40
                      ? 'text-warning'
                      : 'text-muted-foreground'
                  )}
                >
                  {bio.length} / {BIO_LIMIT}
                </p>
              </div>
            </Card>
          )}

          {section === 'account' && (
            <>
              <Card className="p-6">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-medium">Change password</h2>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="pw-cur">Current</Label>
                    <Input id="pw-cur" type="password" placeholder="••••••••" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="pw-new">New</Label>
                    <Input id="pw-new" type="password" placeholder="••••••••" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="pw-confirm">Confirm</Label>
                    <Input id="pw-confirm" type="password" placeholder="••••••••" />
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-5">
                  <div>
                    <p className="text-sm">Two-factor authentication</p>
                    <p className="text-xs text-muted-foreground">
                      Require a code from your authenticator app at sign in.
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-sm font-medium">Active sessions</h2>
                <ul className="mt-4 divide-y divide-border/50">
                  {SESSIONS.map((s) => (
                    <li key={s.id} className="flex flex-wrap items-center gap-3 py-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm">{s.device}</p>
                          {s.current && <Badge variant="success">This device</Badge>}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {s.location} · {s.last}
                        </p>
                      </div>
                      {!s.current && (
                        <Button variant="ghost" size="sm">
                          Revoke
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </Card>
            </>
          )}

          {section === 'connections' && (
            <Card className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-medium">Connected accounts</h2>
                </div>
                <Button variant="secondary" size="sm">
                  <RefreshCw className="h-4 w-4" /> Sync now
                </Button>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Last synced 12 minutes ago
              </p>

              <ul className="mt-5 divide-y divide-border/50">
                {CONNECTIONS.map((name) => {
                  const platform = (user?.platforms ?? currentUser.platforms).find(
                    (p) => p.platform === name
                  )
                  const connected = linked.has(name)
                  return (
                    <li key={name} className="flex flex-wrap items-center gap-3 py-4">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-xs font-medium">
                        {name === 'GitHub' ? (
                          <GithubMark className="h-5 w-5" />
                        ) : name === 'Google' ? (
                          <GoogleMark className="h-5 w-5" />
                        ) : (
                          name.slice(0, 2).toUpperCase()
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {connected && platform
                            ? `@${platform.handle} · rating ${platform.rating}`
                            : 'Not connected'}
                        </p>
                      </div>
                      {connected ? (
                        <Button variant="outline" size="sm">
                          Disconnect
                        </Button>
                      ) : (
                        <Button size="sm">Connect</Button>
                      )}
                    </li>
                  )
                })}
              </ul>
            </Card>
          )}

          {section === 'notifications' && (
            <Card className="p-6">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-medium">Notification channels</h2>
              </div>

              <div className="mt-6 grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-6 gap-y-1">
                <span />
                {['Email', 'Push', 'In-app'].map((c) => (
                  <span
                    key={c}
                    className="pb-2 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    {c}
                  </span>
                ))}

                {NOTIFY_ROWS.map((r) => (
                  <div key={r.key} className="contents">
                    <div className="border-t border-border/50 py-4">
                      <p className="text-sm">{r.label}</p>
                      <p className="text-xs text-muted-foreground">{r.detail}</p>
                    </div>
                    {['email', 'push', 'inapp'].map((c) => (
                      <div
                        key={c}
                        className="flex justify-center border-t border-border/50 py-4"
                      >
                        <Checkbox
                          checked={channels[r.key]?.includes(c)}
                          onCheckedChange={() => toggleChannel(r.key, c)}
                          aria-label={`${r.label} via ${c}`}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {section === 'appearance' && (
            <Card className="p-6">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-medium">Appearance</h2>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {THEMES.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTheme(t.key)}
                    className={cn(
                      'rounded-2xl border border-border/60 p-3 text-left transition-all',
                      theme === t.key && 'ring-2 ring-primary'
                    )}
                  >
                    <div className={cn('h-20 rounded-xl', t.swatch)} />
                    <p className="mt-3 text-sm">{t.label}</p>
                  </button>
                ))}
              </div>

              <div className="mt-6 border-t border-border/50 pt-5">
                <p className="text-sm">Accent colour</p>
                <div className="mt-3 flex gap-2">
                  {['bg-primary', 'bg-lime', 'bg-chart-3', 'bg-chart-4', 'bg-warning'].map(
                    (c, i) => (
                      <button
                        key={c}
                        aria-label={`Accent ${i + 1}`}
                        className={cn(
                          'h-8 w-8 rounded-full transition-transform hover:scale-110',
                          c,
                          i === 0 && 'ring-2 ring-foreground ring-offset-2 ring-offset-card'
                        )}
                      />
                    )
                  )}
                </div>
              </div>

              <div className="mt-6 divide-y divide-border/50 border-t border-border/50">
                <div className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-sm">Compact density</p>
                    <p className="text-xs text-muted-foreground">
                      Tighter padding across tables and lists.
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <p className="text-sm">Font size</p>
                    <p className="text-xs text-muted-foreground">
                      Base size for body text.
                    </p>
                  </div>
                  <Select defaultValue="md">
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sm">Small</SelectItem>
                      <SelectItem value="md">Medium</SelectItem>
                      <SelectItem value="lg">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          )}

          {section === 'privacy' && (
            <Card className="p-6">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-medium">Privacy</h2>
              </div>

              <div className="mt-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm">Profile visibility</p>
                  <p className="text-xs text-muted-foreground">
                    Who can open your profile page.
                  </p>
                </div>
                <Select defaultValue="public">
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="team">Team only</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-4 divide-y divide-border/50 border-t border-border/50">
                {[
                  ['Show my rating', 'Display current and peak rating publicly.'],
                  ['Show solved problems', 'Let others browse your solved list.'],
                  ['Appear on leaderboards', 'Include me in global rankings.'],
                  ['Allow direct messages', 'Anyone on O(1) can message you.'],
                ].map(([title, detail], i) => (
                  <div key={title} className="flex items-center justify-between py-4">
                    <div>
                      <p className="text-sm">{title}</p>
                      <p className="text-xs text-muted-foreground">{detail}</p>
                    </div>
                    <Switch defaultChecked={i !== 3} />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {section === 'danger' && (
            <Card className="border-destructive/40 p-6">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-destructive" />
                <h2 className="text-sm font-medium">Danger zone</h2>
              </div>

              <ul className="mt-5 divide-y divide-border/50">
                <li className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <p className="text-sm">Export my data</p>
                    <p className="text-xs text-muted-foreground">
                      Submissions, sheets and contest history as JSON.
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Export
                  </Button>
                </li>
                <li className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <p className="text-sm">Deactivate account</p>
                    <p className="text-xs text-muted-foreground">
                      Hide your profile — you can reactivate any time.
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Deactivate
                  </Button>
                </li>
                <li className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <p className="text-sm text-destructive">Delete account</p>
                    <p className="text-xs text-muted-foreground">
                      Permanent. All progress and teams are removed.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </li>
              </ul>
            </Card>
          )}
        </div>
      </div>

      {/* ---------------------------------------------- Delete dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete your account</DialogTitle>
            <DialogDescription>
              This removes your submissions, sheets, teams and contest history.
              It cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor="confirm">
              Type <span className="font-mono text-foreground">DELETE</span> to confirm
            </Label>
            <Input
              id="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
            />
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={confirmText !== 'DELETE'}
              onClick={() => setDeleteOpen(false)}
            >
              Delete account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
