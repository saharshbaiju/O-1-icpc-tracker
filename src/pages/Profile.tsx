import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { ErrorNote, Section, SqlPeek } from '@/components/bits'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api, attempt, useApi, type University } from '@/lib/api'
import { useAuth, useMe } from '@/lib/auth'

export default function Profile() {
  const me = useMe()
  const { signOut, refresh } = useAuth()
  const navigate = useNavigate()
  const universities = useApi<University[]>('/universities').data ?? []

  const [name, setName] = useState(me.name)
  const [email, setEmail] = useState(me.email)
  const [handle, setHandle] = useState(me.cf_handle ?? '')
  const [univ, setUniv] = useState(String(me.univ_id))
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [pwMessage, setPwMessage] = useState<string | null>(null)
  const [changingPw, setChangingPw] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const err = await attempt(() =>
      api.put('/me', { name, email, cf_handle: handle, univ_id: Number(univ) })
    )
    if (!err) await refresh()
    setSaving(false)
    setError(err)
    setSaved(!err)
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    setChangingPw(true)
    const err = await attempt(() => api.put('/me/password', { current, new: next }))
    setChangingPw(false)
    setPwMessage(err ?? 'Password changed.')
    if (!err) {
      setCurrent('')
      setNext('')
    }
  }

  const edited = () => setSaved(false)

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader
        title="Profile"
        description="Your row in app_user."
        actions={
          <Button
            variant="outline"
            size="pill"
            onClick={async () => {
              await signOut()
              navigate('/')
            }}
          >
            <LogOut /> Sign out
          </Button>
        }
      />

      <Section title="Details">
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="p-name">Name</Label>
              <Input id="p-name" value={name} onChange={(e) => (setName(e.target.value), edited())} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-email">E-mail</Label>
              <Input id="p-email" type="email" value={email} onChange={(e) => (setEmail(e.target.value), edited())} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-handle">Codeforces handle</Label>
              <Input id="p-handle" value={handle} onChange={(e) => (setHandle(e.target.value), edited())} placeholder="needed for syncing" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-univ">University</Label>
              <Select value={univ} onValueChange={(v) => (setUniv(v), edited())}>
                <SelectTrigger id="p-univ">
                  <SelectValue className="truncate" />
                </SelectTrigger>
                <SelectContent>
                  {universities.map((u) => (
                    <SelectItem key={u.univ_id} value={String(u.univ_id)}>
                      {u.univ_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <ErrorNote error={error} />
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
            {saved && <span className="text-xs text-muted-foreground">Saved.</span>}
          </div>
        </form>
        <div className="mt-5">
          <SqlPeek
            sql={`-- PUT /api/me  (backend/routes/auth.py)
UPDATE app_user
SET name = :name, email = :email, cf_handle = :cf_handle, univ_id = :univ_id
WHERE user_id = :me;
-- email and cf_handle are UNIQUE: taking someone else's is rejected by the database.`}
          />
        </div>
      </Section>

      <Section title="Password">
        <form onSubmit={changePassword} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pw-cur">Current password</Label>
              <Input id="pw-cur" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw-new">New password</Label>
              <Input id="pw-new" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
            </div>
          </div>
          {pwMessage && <p role="status" className="text-xs">{pwMessage}</p>}
          <Button type="submit" variant="outline" disabled={changingPw}>
            {changingPw ? 'Changing…' : 'Change password'}
          </Button>
          <p className="text-[11px] text-muted-foreground">
            Only a salted hash is stored in <code className="font-mono">password_hash</code>, never the password itself.
          </p>
        </form>
      </Section>
    </div>
  )
}
