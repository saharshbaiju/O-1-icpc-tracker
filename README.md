<div align="center">

# O(1)

**The single workspace for competitive programmers.**

A unified problem repository, mentor-built practice sheets, and analytics that tell
you what to fix next — instead of six browser tabs and a spreadsheet.

<sub>React 19 · TypeScript · Vite · Tailwind CSS · shadcn/ui · Recharts</sub>

</div>

---

## What this is

O(1) is an ICPC preparation tracker. It gives a competitive programming team one
place to practise, compete, and measure — and gives the mentor coaching them a way
to assign work and watch it land.

**This repository is the complete front end.** Every screen is built and navigable,
but it runs entirely on seeded mock data — there is no backend yet. See
[Project status](#project-status) for exactly where the seam is.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
```

You land on the marketing page. Click **Sign in** or **Start training** — auth is a
stub, so any well-formed email works (sign-in wants 6+ characters, sign-up wants 8+).
The role you pick on the way in changes what you can see.

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with hot module replacement |
| `npm run build` | Typechecks with `tsc -b`, then builds to `dist/` |
| `npm run preview` | Serves the production build locally |
| `npm run lint` | Runs [oxlint](https://oxc.rs) |

> `npm run build` typechecks before bundling, so a type error fails the build.
> Treat it as the real gate, not `lint`.

## Feature tour

### Practice
- **Problem repository** — one searchable index with filters for platform, difficulty,
  topic and status, topic chips, sorting by rating or acceptance, and pagination.
  Every filter is wired to real state, not decoration.
- **Practice sheets** — mentor-authored topic ladders with deadlines, per-problem
  checkboxes, and progress bars. Deadlines turn amber inside 7 days and red once
  overdue. Mentors additionally get a per-student assignment roster.
- **Learning resources** — articles, videos, notes, roadmaps, tutorials and books,
  filterable by type and topic, with working bookmarks and per-topic coverage bars.

### Measure
- **Dashboard** — rating, solve momentum, streak, a rating curve, a practice-by-time
  grid, recent activity, upcoming contests and active sheets.
- **Analytics** — rating progression with a peak reference line, a platform donut,
  solves stacked by difficulty per month, topic mastery bars banded by strength, a
  contest performance table, and a full 53-week submission heatmap.
- **Leaderboard** — a podium for the top three plus a full table that re-sorts live
  by rating, problems solved, XP or streak, with your own rank pinned beneath it.
  Handles link out to Codeforces.

### Team
- **Teams** — your squad with combined topic coverage on a radar chart that names your
  two weakest areas, a member roster, a copy-able invite link, shared resources, and
  a directory of other teams to join.
- **Calendar** — a month grid colour-coded by event type, with a selected-day panel,
  upcoming list, and reminder toggles.

### You
- **Settings** — profile, account and sessions, connected judge accounts, notification
  channels, appearance, privacy, and a danger zone whose delete button stays disabled
  until you type `DELETE`.

## Roles

Two roles are modelled, chosen at sign-up and switchable at any time from the
selector in the top bar:

| Role | Sees |
| --- | --- |
| **Student** | Practice, own analytics, teams, leaderboard, calendar |
| **Mentor** | The above, plus sheet authoring, assignment rosters, and student progress |

## Routes

```
/                      Marketing landing page
/login                 Sign in  (email · Google · GitHub · role picker)
/signup                Create account (with live password-strength meter)

/app                   Dashboard
/app/analytics         Performance analytics
/app/leaderboard       Global / university / team rankings
/app/problems          Problem repository
/app/sheets            Practice sheets
/app/resources         Learning resources
/app/teams             Team management
/app/calendar          Schedule and reminders
/app/settings          Account settings
*                      404
```

Everything under `/app` sits behind `AppLayout`, which redirects to `/login` when
signed out.

## Project structure

```
src/
├── App.tsx                  Router — every route is declared here
├── main.tsx                 Entry point
├── index.css                Design tokens, .liquid-glass, .panel, animations
│
├── layouts/
│   ├── AppLayout.tsx        Auth guard + sidebar/topbar shell for /app
│   └── AuthLayout.tsx       Split-screen shell for login & signup
│
├── lib/
│   ├── data.ts              ← All mock data and domain types. The backend seam.
│   ├── auth.tsx             AuthProvider / useAuth (localStorage-backed stub)
│   ├── nav.ts               Sidebar sections + per-role visibility
│   └── utils.ts             cn() — clsx + tailwind-merge
│
├── components/
│   ├── ui/                  shadcn/ui primitives (button, card, table, dialog, …)
│   ├── layout/              Sidebar, Topbar, PageHeader
│   ├── Brand.tsx            The O(1) wordmark
│   ├── BrandIcons.tsx       GitHub & Google marks (see the gotcha below)
│   ├── StatCard.tsx         The standard metric tile
│   ├── RolePicker.tsx       Student / Mentor selector
│   ├── OAuthButtons.tsx     Google + GitHub sign-in
│   └── VideoBackground.tsx  Fullscreen looping hero video
│
└── pages/                   One file per route
```

## Design system

The look is a near-black, violet-tinted dark theme: large rounded cards, generous
padding, pill-shaped controls, violet as the primary accent and lime for positive
series.

**Everything is driven by HSL custom properties** declared in `src/index.css` and
mapped to Tailwind in `tailwind.config.js`. Change a token there and it propagates
across all 12 pages.

```css
--background: 255 24% 4%;     /* near-black with a violet cast */
--card:       252 20% 8%;
--primary:    258 90% 66%;    /* violet */
--lime:        74 90% 62%;    /* positive / secondary series */
--easy / --medium / --hard    /* problem difficulty scale */
--chart-1 … --chart-5         /* chart series */
```

Conventions worth keeping if you extend this:

- **Never hardcode a hex.** Use the token classes: `bg-card`, `text-muted-foreground`,
  `text-primary`, `border-border`, `text-success`, `text-lime`, `bg-chart-4`, and so on.
- **Active state is an inverted pill** — `bg-foreground text-background`. Inactive is
  `text-muted-foreground hover:text-foreground`. This is used for the sidebar, tabs,
  and every filter chip.
- **Page skeleton** is always `<div className="space-y-6">` wrapping a `<PageHeader>`.
  `PageHeader` renders its title in Instrument Serif for you.
- **Typography** — Instrument Serif for display headings (applied inline via
  `style={{ fontFamily: "'Instrument Serif', serif" }}`), Inter for everything else.

## Working with the mock data

`src/lib/data.ts` is the single source of truth for every entity on screen: users,
problems, sheets, contests, teams, resources, calendar events, leaderboards, and all
the chart series.

It exports both the data and the TypeScript types (`Problem`, `Contest`, `Team`,
`Role`, …), plus small formatters — `formatDate`, `formatDuration`, `compact`,
`ratingColor`, `difficultyVariant`.

The data is generated by a **seeded PRNG**, so it is identical on every reload.
Charts, rankings and heatmaps do not shuffle between refreshes, which makes visual
diffs and screenshots meaningful.

To wire up a real backend, replace the exports in this one file with API calls. The
pages import named exports and never construct core entities themselves, so the
component layer should need little to no change.

## Gotchas

A few things that will bite you if you don't know them:

**`lucide-react` is v1 and has no brand icons.** `Github`, `Twitter` and friends were
removed. Importing `Github` fails the build. Use `GithubMark` / `GoogleMark` from
`@/components/BrandIcons` instead.

**Charts have animation disabled deliberately.** Every Recharts series carries
`isAnimationActive={false}`. Recharts replays its mount animation on *every* re-render,
so without this the charts visibly redraw each time you click a period toggle. Leave
it off.

**Unique gradient IDs per page.** SVG gradient IDs are global to the document. Each
page prefixes its own (`analyticsRatingFill`, `dashboardRatingFill`).
Reusing an ID makes one chart silently adopt another's fill.

**TypeScript is strict about unused code.** `noUnusedLocals` and `noUnusedParameters`
are on, so a leftover import fails `npm run build`. `verbatimModuleSyntax` is also on
— import types with `import type { X }`.

**`mx-auto` on a flex item doesn't do what you expect.** In a column-direction flex
container, `margin-inline: auto` is a *cross-axis* margin. It absorbs the free space
and cancels `align-items: stretch`, so the element shrink-wraps instead of filling.
Pair it with `w-full`. This is what originally broke the landing page nav bar.

## Project status

| Area | State |
| --- | --- |
| UI for all 12 routes | ✅ Complete |
| Design system & tokens | ✅ Complete |
| Role-based navigation & guards | ✅ Complete (client-side) |
| Filtering, sorting, tabs, dialogs | ✅ Interactive |
| Backend / persistence | ❌ Not started |
| Real authentication | ❌ Stub — `localStorage` flag only |
| Judge integrations | ❌ Not started |

**Do not ship the auth as-is.** `src/lib/auth.tsx` accepts any credentials and stores
a plain flag in `localStorage`. It exists so the role-based UI can be demonstrated.
Real sessions, password hashing, and server-side authorisation all still need building —
in particular, the admin guard is a client-side render check and provides no actual
security.

### Roadmap

- Backend API and persistence
- Real authentication with OAuth for Google and GitHub
- Judge integrations for Codeforces, CodeChef, LeetCode, AtCoder and GitHub, so
  ratings and solved problems sync automatically
- AI assistance for personalised recommendations and code explanation
- Code splitting — the bundle is currently a single ~1.7 MB chunk (~460 kB gzipped);
  route-level `React.lazy` is the obvious first cut

---

<div align="center">
<sub>Built for competitive programmers.</sub>
</div>
