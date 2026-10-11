import { GraduationCap, UserCog } from 'lucide-react'

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
  ]

/* The chosen role is a black tile; the other is a thin-bordered white sheet. */
export function RolePicker({
  value,
  onChange,
}: {
  value: Role
  onChange: (role: Role) => void
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {ROLES.map((r) => {
        const active = value === r.value
        return (
          <button
            key={r.value}
            type="button"
            onClick={() => onChange(r.value)}
            aria-pressed={active}
            className={cn(
              'rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card hover:bg-secondary'
            )}
          >
            <r.icon
              className={cn(
                'h-4 w-4',
                active ? 'text-primary-foreground' : 'text-muted-foreground'
              )}
            />
            <p className="mt-2 text-sm font-medium">{r.label}</p>
            <p
              className={cn(
                'mt-0.5 text-[11px] leading-snug',
                active ? 'text-primary-foreground/70' : 'text-muted-foreground'
              )}
            >
              {r.hint}
            </p>
          </button>
        )
      })}
    </div>
  )
}
