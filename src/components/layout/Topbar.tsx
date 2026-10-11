import { useState } from 'react'
import { LogOut, Menu, Search, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Initials } from '@/components/bits'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { useAuth, useMe } from '@/lib/auth'

export function Topbar({ menuOpen, onMenuClick }: { menuOpen?: boolean; onMenuClick: () => void }) {
  const me = useMe()
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background px-4 sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label="Open navigation"
        aria-expanded={menuOpen}
      >
        <Menu />
      </Button>

      <form
        role="search"
        className="relative hidden max-w-md flex-1 sm:block"
        onSubmit={(e) => {
          e.preventDefault()
          navigate(`/app/problems?q=${encodeURIComponent(q.trim())}`)
        }}
      >
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search problems by code or title…"
          aria-label="Search problems"
          className="h-9 rounded-full pl-10"
        />
      </form>

      <div className="flex flex-1 items-center justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="rounded-full transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground"
              aria-label="Account menu"
            >
              <Initials name={me.name} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <span className="block truncate">{me.name}</span>
              <span className="block truncate text-[11px] font-normal normal-case tracking-normal text-muted-foreground">{me.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate('/app/profile')}>
              <UserRound className="h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={async () => {
                await signOut()
                navigate('/')
              }}
            >
              <LogOut className="h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
