import * as icons from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { Brand } from '@/components/Brand'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth'
import { ROLE_LABEL } from '@/lib/data'
import { visibleSections } from '@/lib/nav'
import { cn } from '@/lib/utils'

function Icon({ name, className }: { name: string; className?: string }) {
  const Cmp = (icons as unknown as Record<string, icons.LucideIcon>)[name]
  if (!Cmp) return null
  return <Cmp className={className} />
}

export function Sidebar({
  open,
  onNavigate,
}: {
  open: boolean
  onNavigate?: () => void
}) {
  const { role, user } = useAuth()
  const sections = visibleSections(role)

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-[268px] flex-col border-r border-border/70 bg-card/60 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <div className="flex h-[72px] shrink-0 items-center px-6">
        <NavLink to="/app" onClick={onNavigate}>
          <Brand size="sm" />
        </NavLink>
      </div>

      <nav className="scroll-slim flex-1 space-y-6 overflow-y-auto px-4 pb-6">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/60">
              {section.title}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/app'}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center gap-3 rounded-full px-3 py-2.5 text-sm transition-colors',
                        isActive
                          ? 'bg-foreground font-medium text-background'
                          : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                      )
                    }
                  >
                    <Icon name={item.icon} className="h-[18px] w-[18px]" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge ? (
                      <Badge
                        variant="default"
                        className="h-5 min-w-5 justify-center px-1.5 group-aria-[current=page]:bg-background/15"
                      >
                        {item.badge}
                      </Badge>
                    ) : null}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-border/70 p-4">
        <div className="flex items-center gap-3 rounded-2xl bg-secondary/40 p-3">
          <img
            src={user?.avatar}
            alt=""
            className="h-9 w-9 rounded-full bg-primary/20"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {ROLE_LABEL[role]} · {user?.rank}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
