import { useState, type ReactNode } from 'react'

import { ErrorNote } from '@/components/bits'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { api, attempt, LANGUAGES, VERDICTS, type Verdict } from '@/lib/api'
import { VERDICT_SHORT } from '@/lib/format'

/**
 * Records one row in `submission` (POST /api/submissions). Normally the
 * Codeforces sync does this; the dialog is for problems it cannot see.
 */
export function SubmitDialog({
  problemCode,
  trigger,
  onSaved,
}: {
  problemCode?: string
  trigger: ReactNode
  onSaved?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState(problemCode ?? '')
  const [verdict, setVerdict] = useState<Verdict>('OK')
  const [language, setLanguage] = useState(LANGUAGES[0])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    const err = await attempt(() =>
      api.post('/submissions', { problem_code: code.trim().toUpperCase(), verdict, language })
    )
    setBusy(false)
    setError(err)
    if (!err) {
      setOpen(false)
      onSaved?.()
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (o) {
          setCode(problemCode ?? '')
          setError(null)
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Log a submission</DialogTitle>
          <DialogDescription>
            Inserts one row into <code className="font-mono">submission</code>. Use “Sync from Codeforces” to import them all.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="submit-code">Problem code</Label>
            <Input
              id="submit-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="1520C"
              disabled={problemCode !== undefined}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="submit-verdict">Verdict</Label>
              <Select value={verdict} onValueChange={(v) => setVerdict(v as Verdict)}>
                <SelectTrigger id="submit-verdict">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VERDICTS.map((v) => (
                    <SelectItem key={v} value={v}>
                      {VERDICT_SHORT[v]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="submit-language">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="submit-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <ErrorNote error={error} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? 'Inserting…' : 'Insert row'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
