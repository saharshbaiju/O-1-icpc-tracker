import {
  ClipboardList,
  Database,
  History,
  LayoutDashboard,
  ListTodo,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { Brand } from '@/components/Brand'
import { Initials } from '@/components/bits'
import { useMe } from '@/lib/auth'
import { NAV_SECTIONS } from '@/lib/nav'
import { cn } from '@/lib/utils'

const ICONS: Record<string, LucideIcon> = {
  ClipboardList,
  Database,
  History,
  LayoutDashboard,
  ListTodo,
  Trophy,
  Users,
}

function Icon({ name, className }: { name: string; className?: string }) {
  const Cmp = ICONS[name]
  return Cmp ? <Cmp className={className} /> : null
}

export function Sidebar({
  open,
  onNavigate,
}: {
  open: boolean
  onNavigate?: () => void
}) {
  const me = useMe()

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-[240px] flex-col border-r border-border bg-card transition-[transform,visibility] duration-300 lg:translate-x-0',
        // When closed on mobile it is also made invisible, so Tab cannot reach the hidden links.
        open ? 'translate-x-0' : '-translate-x-full max-lg:invisible'
      )}
    >
      <div className="flex h-14 shrink-0 items-center border-b border-border px-5">
        <NavLink to="/app" onClick={onNavigate}>
          <Brand size="sm" />
        </NavLink>
      </div>

      <nav className="scroll-slim flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="paper-label px-3 pb-2">{section.title}</p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/app'}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors',
                        isActive
                          ? 'bg-secondary font-medium text-foreground'
                          : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                      )
                    }
                  >
                    <Icon name={item.icon} className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <NavLink
        to="/app/profile"
        onClick={onNavigate}
        className="flex shrink-0 items-center gap-3 border-t border-border px-5 py-4 transition-colors hover:bg-secondary/60"
      >
        <Initials name={me.name} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium">{me.name}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {me.team_name ?? 'No team yet'}
          </p>
        </div>
      </NavLink>
    </aside>
  )
}
