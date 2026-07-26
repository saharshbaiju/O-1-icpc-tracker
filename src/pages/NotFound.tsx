import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Brand } from '@/components/Brand'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="relative grid min-h-screen place-items-center px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_400px_at_50%_10%,hsl(var(--primary)/0.16),transparent_70%)]"
      />
      <div className="relative text-center">
        <Brand size="lg" className="mb-10" />
        <p className="font-mono text-sm uppercase tracking-[0.3em] text-primary">
          404
        </p>
        <h1
          className="mt-4 text-5xl tracking-tight sm:text-7xl"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          No solution found.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
          This route does not exist — not even in O(1). Head back and try a
          different path.
        </p>
        <div className="mt-10 flex justify-center gap-3">
          <Button asChild className="rounded-full px-8">
            <Link to="/app">
              <ArrowLeft className="h-4 w-4" /> Back to dashboard
            </Link>
          </Button>
          <Button variant="outline" asChild className="rounded-full px-8">
            <Link to="/">Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
