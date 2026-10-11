import { Link } from 'react-router-dom'

import { PaperBrand } from '@/components/PaperBrand'
import { PixelField } from '@/components/PixelField'

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Practice', href: '#practice' },
  { label: 'Sign in', href: '/login' },
]

const FEATURES = [
  {
    n: '01',
    title: 'Problems',
    body: 'Codeforces problems tagged by topic, with difficulty derived from rating. Filter by topic, difficulty or what you have solved.',
  },
  {
    n: '02',
    title: 'Submissions',
    body: 'Every attempt with its verdict and language, synced from Codeforces and kept for good.',
  },
  {
    n: '03',
    title: 'Sheets',
    body: 'Ordered practice lists for your team, with deadlines and a solved-by-whom grid.',
  },
  {
    n: '04',
    title: 'Teams',
    body: 'ICPC squads of up to three. See who has solved what, together.',
  },
  {
    n: '05',
    title: 'Leaderboard',
    body: 'Ranked by distinct problems solved, filterable by university. Always current.',
  },
  {
    n: '06',
    title: 'Built on SQL',
    body: 'Nine normalised tables, constraints, a trigger and views. Every screen shows the query behind it.',
  },
]

export default function Landing() {
  return (
    <div className="theme-paper min-h-screen">
      {/* ------------------------------------------------ Hero */}
      <section className="relative h-screen min-h-[640px] overflow-hidden">
        <PixelField className="absolute inset-0 h-full w-full" />

        <div className="pointer-events-none relative z-10 flex h-full flex-col">
          <header className="flex items-start justify-between px-6 pt-6 sm:px-10 sm:pt-8">
            <Link to="/" className="pointer-events-auto">
              <PaperBrand />
            </Link>
            <nav className="pointer-events-auto flex items-center gap-6 sm:gap-8">
              {NAV_LINKS.map((l) =>
                l.href.startsWith('/') ? (
                  <Link key={l.label} to={l.href} className="paper-label hover:underline">
                    {l.label}
                  </Link>
                ) : (
                  <a key={l.label} href={l.href} className="paper-label hover:underline">
                    {l.label}
                  </a>
                )
              )}
            </nav>
          </header>

          <div className="px-6 pt-16 sm:px-10 sm:pt-20">
            <h1 className="font-headline text-[13vw] sm:text-7xl lg:text-8xl">
              Practice
              <br />
              is hard.
            </h1>
          </div>

          <div className="mt-auto flex flex-col items-start gap-5 px-6 pb-8 sm:items-end sm:px-10 sm:pb-10">
            <p className="pointer-events-auto max-w-[260px] text-[11px] leading-relaxed text-foreground sm:text-right">
              Helping ICPC teams figure out what to solve next, and do a tiny bit
              better every contest.
            </p>
            <Link
              to="/signup"
              className="pointer-events-auto inline-flex h-10 items-center rounded-full bg-primary px-6 text-xs font-medium text-primary-foreground transition-colors hover:bg-[hsl(0_0%_20%)]"
            >
              Start training
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Features */}
      <section id="features" className="border-t border-border px-6 py-20 sm:px-10 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="paper-label text-muted-foreground">Features</p>
            <h2 className="font-headline mt-4 max-w-sm text-4xl sm:text-5xl">
              The whole training loop, in one place.
            </h2>
          </div>
          <ul className="grid gap-px bg-border sm:grid-cols-2">
            {FEATURES.map((f) => (
              <li key={f.n} className="bg-background p-6 sm:p-8">
                <p className="font-mono text-[11px] text-muted-foreground">{f.n}</p>
                <h3 className="mt-6 text-lg tracking-tight">{f.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{f.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------ Practice */}
      <section id="practice" className="border-t border-border bg-foreground px-6 py-20 text-background sm:px-10 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <p className="paper-label opacity-60">Practice</p>
            <h2 className="font-headline mt-4 max-w-md text-4xl sm:text-5xl">
              Sheets your whole team works through.
            </h2>
          </div>
          <ul className="grid gap-4 self-end text-sm">
            {[
              'Ordered problem lists with deadlines',
              'Progress computed from accepted submissions',
              'A problems × teammates grid that shows the gaps',
              'One sheet, three people, no spreadsheet',
            ].map((li, i) => (
              <li key={li} className="flex items-baseline gap-4 border-t border-background/20 pt-4">
                <span className="font-mono text-[11px] opacity-60">{String(i + 1).padStart(2, '0')}</span>
                {li}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------ CTA + footer */}
      <section className="border-t border-border px-6 py-20 sm:px-10 sm:py-28">
        <h2 className="font-headline max-w-3xl text-4xl sm:text-6xl">
          Your next regional starts with today's problem.
        </h2>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            to="/signup"
            className="inline-flex h-10 items-center rounded-full bg-primary px-6 text-xs font-medium text-primary-foreground transition-colors hover:bg-[hsl(0_0%_20%)]"
          >
            Create your account
          </Link>
          <Link
            to="/login"
            className="inline-flex h-10 items-center rounded-full border border-border px-6 text-xs font-medium transition-colors hover:bg-card"
          >
            Sign in
          </Link>
        </div>
      </section>

      <footer className="flex flex-col gap-4 border-t border-border px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <PaperBrand />
        <p className="text-[11px] text-muted-foreground">© 2026 O(1). Built for competitive programmers.</p>
        <div className="flex gap-6">
          <a href="#features" className="paper-label hover:underline">Features</a>
          <Link to="/login" className="paper-label hover:underline">Sign in</Link>
          <Link to="/signup" className="paper-label hover:underline">Sign up</Link>
        </div>
      </footer>
    </div>
  )
}
