import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { Brand } from '@/components/Brand'
import { VideoBackground } from '@/components/VideoBackground'

/**
 * Split auth shell: form on the left, the marketing video panel on the right.
 * On small screens the video collapses away and the form takes the page.
 */
export function AuthLayout({
  children,
  quote,
  attribution,
}: {
  children: ReactNode
  quote: string
  attribution: string
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Form side */}
      <div className="relative flex flex-col px-6 py-8 sm:px-10 lg:px-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_400px_at_20%_-5%,hsl(var(--primary)/0.14),transparent_70%)]"
        />
        <div className="relative">
          <Link to="/" className="inline-block">
            <Brand />
          </Link>
        </div>

        <div className="relative flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">{children}</div>
        </div>

        <p className="relative text-center text-xs text-muted-foreground/70">
          © 2026 O(1) · Built for competitive programmers
        </p>
      </div>

      {/* Video side */}
      <div className="relative hidden overflow-hidden lg:block">
        <VideoBackground />
        <div
          aria-hidden
          className="absolute inset-0 z-[1] bg-gradient-to-tr from-background via-background/40 to-transparent"
        />
        <div className="relative z-10 flex h-full flex-col justify-end p-14">
          <blockquote
            className="max-w-lg text-3xl leading-[1.15] tracking-tight xl:text-4xl"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            “{quote}”
          </blockquote>
          <p className="mt-6 text-sm text-muted-foreground">{attribution}</p>
        </div>
      </div>
    </div>
  )
}
