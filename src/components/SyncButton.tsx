import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { api, ApiError } from '@/lib/api'
import { useMe } from '@/lib/auth'

/** POST /api/sync — imports the signed-in user's Codeforces submissions. */
export function SyncButton({ onDone, variant = 'default' }: { onDone?: () => void; variant?: 'default' | 'outline' }) {
  const me = useMe()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (!me.cf_handle) {
    return (
      <Button size="pill" variant={variant} asChild>
        <Link to="/app/profile">Add Codeforces handle</Link>
      </Button>
    )
  }

  async function sync() {
    setBusy(true)
    setMessage(null)
    try {
      const r = await api.post<{ new_problems: number; new_submissions: number }>('/sync')
      setMessage(
        r.new_submissions === 0
          ? 'Already up to date.'
          : `Imported ${r.new_submissions} submissions and ${r.new_problems} new problems.`
      )
      onDone?.()
    } catch (e) {
      setMessage(e instanceof ApiError ? e.message : 'Sync failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <Button size="pill" variant={variant} onClick={sync} disabled={busy}>
        <RefreshCw className={busy ? 'animate-spin' : undefined} />
        {busy ? 'Syncing…' : 'Sync from Codeforces'}
      </Button>
      {message && <p role="status" className="max-w-64 text-[11px] text-muted-foreground sm:text-right">{message}</p>}
    </div>
  )
}
