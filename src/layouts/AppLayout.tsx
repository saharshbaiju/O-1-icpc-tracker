import { useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useAuth } from '@/lib/auth'

export function AppLayout() {
  const { isAuthenticated } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-background">
        {/* Ambient violet wash, matching the marketing page */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(900px_500px_at_15%_-10%,hsl(var(--primary)/0.16),transparent_70%),radial-gradient(700px_400px_at_100%_0%,hsl(var(--chart-4)/0.10),transparent_65%)]"
        />

        <Sidebar open={mobileOpen} onNavigate={() => setMobileOpen(false)} />

        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <div className="relative z-10 lg:pl-[268px]">
          <Topbar onMenuClick={() => setMobileOpen(true)} />
          <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
