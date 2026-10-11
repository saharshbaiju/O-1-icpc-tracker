import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Brand } from '@/components/Brand'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="relative grid min-h-screen place-items-center px-6">
      <div className="relative text-center">
        <Brand size="lg" className="mb-10" />
        <p className="paper-label text-muted-foreground">404</p>
        <h1 className="font-display mt-4 text-4xl sm:text-5xl">
          No solution found.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-xs text-muted-foreground">
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
