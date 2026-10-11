import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { Loading } from '@/components/bits'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useAuth } from '@/lib/auth'

export function AppLayout() {
  const { isAuthenticated, loading } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  // Close the mobile menu on any route change (links, back button, redirects).
  useEffect(() => setMobileOpen(false), [location.pathname])

  // While the mobile menu is open: lock the page behind it and let Escape close it.
  // The lock is a max-lg class so it never sticks if the window is widened.
  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileOpen(false)
    document.body.classList.add('max-lg:overflow-hidden')
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.classList.remove('max-lg:overflow-hidden')
      document.removeEventListener('keydown', onKey)
    }
  }, [mobileOpen])

  if (loading) return <Loading />
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-background">
        <Sidebar open={mobileOpen} onNavigate={() => setMobileOpen(false)} />

        {mobileOpen && (
          <div
            aria-hidden
            className="fixed inset-0 z-30 bg-foreground/20 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <div className="relative z-10 lg:pl-[240px]">
          <Topbar menuOpen={mobileOpen} onMenuClick={() => setMobileOpen(true)} />
          <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
