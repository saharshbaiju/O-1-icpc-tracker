import { GraduationCap, ShieldCheck, UserCog } from 'lucide-react'

import type { Role } from '@/lib/data'
import { cn } from '@/lib/utils'

const ROLES: { value: Role; label: string; hint: string; icon: typeof GraduationCap }[] =
  [
    {
      value: 'student',
      label: 'Student',
      hint: 'Practise, compete, track progress',
      icon: GraduationCap,
    },
    {
      value: 'mentor',
      label: 'Mentor',
      hint: 'Build sheets, review, coach teams',
      icon: UserCog,
    },
    {
      value: 'admin',
      label: 'Admin',
      hint: 'Manage the whole platform',
      icon: ShieldCheck,
    },
  ]

export function RolePicker({
  value,
  onChange,
}: {
  value: Role
  onChange: (role: Role) => void
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {ROLES.map((r) => {
        const active = value === r.value
        return (
          <button
            key={r.value}
            type="button"
            onClick={() => onChange(r.value)}
            aria-pressed={active}
            className={cn(
              'rounded-2xl border p-3 text-left transition-all',
              active
                ? 'border-primary bg-primary/10 ring-2 ring-primary/25'
                : 'border-border bg-secondary/30 hover:border-border hover:bg-secondary/60'
            )}
          >
            <r.icon
              className={cn(
                'h-[18px] w-[18px]',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            />
            <p className="mt-2 text-sm font-medium">{r.label}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
              {r.hint}
            </p>
          </button>
        )
      })}
    </div>
  )
}
