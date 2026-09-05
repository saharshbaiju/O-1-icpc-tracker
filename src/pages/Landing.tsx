import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  ChartSpline,
  ClipboardList,
  Flame,
  ListTodo,
  Medal,
  ShieldCheck,
  Sparkles,
  Swords,
  Trophy,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { Brand } from '@/components/Brand'
import { VideoBackground } from '@/components/VideoBackground'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Practice', href: '#practice' },
  { label: 'Progress', href: '#contests' },
  { label: 'Teams', href: '#community' },
]

const STATS = [
  { value: '8,940', label: 'Problems indexed' },
  { value: '4,218', label: 'Coders training' },
  { value: '1,140', label: 'Sheet problems assigned' },
  { value: '1', label: 'Judge synced' },
]

const FEATURES = [
  {
    icon: ListTodo,
    title: 'Problem repository',
    body: 'One searchable index synced from Codeforces — filter by topic, rating, tag, or difficulty, with editorials and hints attached.',
    span: 'lg:col-span-2',
  },
  {
    icon: ClipboardList,
    title: 'Mentor practice sheets',
    body: 'Topic-wise and custom sheets with deadlines, assignments, and per-student progress.',
  },
  {
    icon: Swords,
    title: 'Past ICPC archives',
    body: 'Assign a past regional or World Final as a sheet and track who cleared what.',
  },
  {
    icon: ChartSpline,
    title: 'Performance analytics',
    body: 'Rating curves, topic mastery, submission heatmaps, and streaks — so you know what to fix next, not just what you solved.',
    span: 'lg:col-span-2',
  },
  {
    icon: Users,
    title: 'Team management',
    body: 'Build a three-person squad, track combined coverage, and share notes and templates.',
  },
  {
    icon: Trophy,
    title: 'Leaderboards',
    body: 'Global, university, and team rankings with filters and performance insight.',
  },
  {
    icon: BookOpen,
    title: 'Learning resources',
    body: 'Curated articles, videos, notes, and roadmaps organised by topic and level.',
  },
  {
    icon: CalendarDays,
    title: 'Shared calendar',
    body: 'Contest schedules, practice sessions, and assignment deadlines on one timeline.',
  },
]

const SECONDARY = [
  { icon: CalendarDays, title: 'Deadline tracking', body: 'Sheet deadlines that turn amber inside a week and red once overdue.' },
  { icon: Medal, title: 'Practice streaks', body: 'Daily solve streaks and a full-year submission heatmap.' },
  { icon: ShieldCheck, title: 'Mentor tools', body: 'Author sheets, assign them, and watch per-student progress land.' },
  { icon: BarChart3, title: 'Linked judge account', body: 'Connect a Codeforces handle and let submissions sync themselves.' },
]

const PLATFORMS = ['Codeforces']

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* ------------------------------------------------ Hero */}
      <section className="relative min-h-screen overflow-hidden">
        <VideoBackground />
        <div
          aria-hidden
          className="absolute inset-0 z-[1] bg-gradient-to-b from-background/50 via-background/25 to-background"
        />

        <div className="relative z-10 flex min-h-screen flex-col">
          <header className="mx-auto flex w-full max-w-7xl flex-row items-center justify-between px-6 py-6 sm:px-8">
            <Link to="/">
              <Brand />
            </Link>

            <nav className="hidden items-center gap-8 md:flex">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="pill" asChild className="hidden sm:inline-flex">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button
                variant="glass"
                size="none"
                className="rounded-full px-6 py-2.5 text-sm text-foreground transition-transform hover:scale-[1.03]"
                asChild
              >
                <Link to="/signup">Start training</Link>
              </Button>
            </div>
          </header>

          <div className="flex flex-1 flex-col items-center justify-center px-6 pb-28 pt-16 text-center">
            <Badge
              variant="outline"
              className="animate-fade-rise mb-8 gap-2 border-white/15 bg-white/5 px-4 py-1.5 text-xs backdrop-blur"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Built for ICPC teams and the people coaching them
            </Badge>

            <h1
              className="animate-fade-rise max-w-5xl text-5xl font-normal leading-[0.95] tracking-[-2.46px] sm:text-7xl md:text-8xl"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Where <em className="not-italic text-muted-foreground">practice</em>{' '}
              compounds into{' '}
              <em className="not-italic text-muted-foreground">rank.</em>
            </h1>

            <p className="animate-fade-rise-delay mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              O(1) is the single workspace for competitive programmers — a unified
              problem repository, mentor-built practice sheets, past ICPC archives,
              and analytics that tell you exactly what to fix next. Stop juggling
              six tabs and a spreadsheet.
            </p>

            <div className="animate-fade-rise-delay-2 mt-12 flex flex-col items-center gap-3 sm:flex-row">
              <Button
                variant="glass"
                size="none"
                className="rounded-full px-14 py-5 text-base text-foreground transition-transform hover:scale-[1.03]"
                asChild
              >
                <Link to="/signup">
                  Create your account <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="none"
                className="rounded-full px-8 py-5 text-base text-muted-foreground hover:text-foreground"
                asChild
              >
                <Link to="/login">Explore the dashboard</Link>
              </Button>
            </div>

            <p className="animate-fade-rise-delay-3 mt-6 text-xs text-muted-foreground/70">
              Free for university teams · No card required
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Stats */}
      <section className="relative z-10 border-y border-border/60 bg-card/30">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-6 sm:px-8 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="px-2 py-10 text-center lg:py-12">
              <p
                className="text-4xl tracking-tight sm:text-5xl"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                {s.value}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ Features */}
      <section id="features" className="relative z-10 px-6 py-24 sm:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <Badge variant="default" className="mb-5">
              Everything in one place
            </Badge>
            <h2
              className="text-4xl leading-[1.05] tracking-tight sm:text-6xl"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              The whole training loop,{' '}
              <em className="not-italic text-muted-foreground">
                from first solve to regional stage.
              </em>
            </h2>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Card
                key={f.title}
                className={`group p-6 transition-colors hover:border-primary/40 hover:bg-secondary/30 ${f.span ?? ''}`}
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/15 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-medium tracking-tight">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
              </Card>
            ))}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SECONDARY.map((f) => (
              <Card key={f.title} className="flex gap-4 p-5">
                <f.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <h3 className="text-sm font-medium">{f.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {f.body}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Practice + contests split */}
      <section
        id="practice"
        className="relative z-10 border-y border-border/60 bg-card/20 px-6 py-24 sm:px-8 lg:py-28"
      >
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <Badge variant="lime" className="mb-5">
              <Flame className="h-3.5 w-3.5" /> Practice
            </Badge>
            <h2
              className="text-3xl leading-tight tracking-tight sm:text-5xl"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Sheets your mentor actually maintains.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              Mentors build topic ladders and custom sets, assign them with
              deadlines, and watch progress per student. Learners get a clear
              queue instead of an infinite scroll of untagged problems.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                'Topic-wise ladders from 800 to 2400 rated',
                'Deadlines, assignments, and completion tracking',
                'Hints and editorials unlocked as you attempt',
                'Streaks that survive a bad contest week',
              ].map((li) => (
                <li key={li} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {li}
                </li>
              ))}
            </ul>
          </div>

          <div id="contests">
            <Badge variant="default" className="mb-5">
              <Swords className="h-3.5 w-3.5" /> Progress
            </Badge>
            <h2
              className="text-3xl leading-tight tracking-tight sm:text-5xl"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Numbers that name your next weakness.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              Every synced submission feeds your analytics — rating curve, topic
              mastery, and a full-year heatmap — so a bad round becomes a study
              plan instead of a bad mood.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                'Rating progression with your peak marked',
                'Topic mastery banded by strength',
                'Full contest history with rank and delta',
                'Team radar naming your two weakest areas',
              ].map((li) => (
                <li key={li} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lime" />
                  {li}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Integrations */}
      <section id="community" className="relative z-10 px-6 py-24 sm:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-5">
            Integrations
          </Badge>
          <h2
            className="text-3xl leading-tight tracking-tight sm:text-5xl"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Connect the judge you already use.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Link your Codeforces handle and O(1) pulls in solved problems,
            ratings, and contest history automatically. AtCoder support is on
            the roadmap.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {PLATFORMS.map((p) => (
              <span
                key={p}
                className="rounded-full border border-border bg-card px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ CTA */}
      <section className="relative z-10 px-6 pb-24 sm:px-8">
        <Card className="relative mx-auto max-w-7xl overflow-hidden border-primary/25 px-6 py-20 text-center sm:px-8">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_300px_at_50%_0%,hsl(var(--primary)/0.28),transparent_70%)]"
          />
          <div className="relative">
            <h2
              className="mx-auto max-w-3xl text-4xl leading-[1.05] tracking-tight sm:text-6xl"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Your next regional starts with today's problem.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground">
              Join 4,218 competitive programmers training with structure instead
              of vibes.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" className="rounded-full px-10" asChild>
                <Link to="/signup">
                  Get started free <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="rounded-full px-10" asChild>
                <Link to="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* ------------------------------------------------ Footer */}
      <footer className="relative z-10 border-t border-border/60 px-6 py-12 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row">
          <Brand size="sm" />
          <p className="text-xs text-muted-foreground">
            © 2026 O(1). Built for competitive programmers.
          </p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <Link to="/login" className="transition-colors hover:text-foreground">
              Sign in
            </Link>
            <Link to="/signup" className="transition-colors hover:text-foreground">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
