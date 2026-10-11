import * as React from 'react'

/**
 * In-browser copy of the O(1) Lite database (docs/lite/schema-lite.sql).
 *
 * Every table, column name, key, CHECK, UNIQUE, foreign key and the team-size
 * trigger is mirrored here, and the views (difficulty, problem status,
 * leaderboard, sheet progress) are plain functions over the tables. When a
 * real PostgreSQL backend replaces this file, the pages do not change.
 */

/* ===================================================================== tables */

export interface University {
  univ_id: number
  univ_name: string
  city: string
}

export interface Team {
  team_id: number
  team_name: string
}

export interface AppUser {
  user_id: number
  name: string
  email: string
  password_hash: string
  cf_handle: string | null
  univ_id: number
  team_id: number | null
}

export interface Topic {
  topic_id: number
  topic_name: string
}

export interface Problem {
  problem_code: string
  title: string
  rating: number | null
}

export interface ProblemTopic {
  problem_code: string
  topic_id: number
}

export const VERDICTS = [
  'OK',
  'WRONG_ANSWER',
  'TIME_LIMIT_EXCEEDED',
  'RUNTIME_ERROR',
  'MEMORY_LIMIT_EXCEEDED',
  'COMPILATION_ERROR',
] as const
export type Verdict = (typeof VERDICTS)[number]

export interface Submission {
  user_id: number
  problem_code: string
  submitted_at: string // ISO timestamp
  verdict: Verdict
  language: string
}

export interface Sheet {
  sheet_id: number
  title: string
  team_id: number
  deadline: string | null // YYYY-MM-DD
}

export interface SheetProblem {
  sheet_id: number
  problem_code: string
  position: number
}

export interface Tables {
  university: University[]
  team: Team[]
  app_user: AppUser[]
  topic: Topic[]
  problem: Problem[]
  problem_topic: ProblemTopic[]
  submission: Submission[]
  sheet: Sheet[]
  sheet_problem: SheetProblem[]
}

export type TableName = keyof Tables

export const LANGUAGES = ['C++17', 'C++20', 'Python 3', 'PyPy 3', 'Java 21', 'Kotlin']

/* A constraint violation, worded like PostgreSQL's own error messages. */
export class DbError extends Error {}

/* ===================================================================== views */

export type Difficulty = 'Easy' | 'Medium' | 'Hard'
export type Status = 'solved' | 'attempted' | 'todo'

/** v_problem_difficulty */
export function difficultyOf(rating: number | null): Difficulty | null {
  if (rating == null) return null
  if (rating < 1400) return 'Easy'
  if (rating < 2000) return 'Medium'
  return 'Hard'
}

export function problemUrl(code: string) {
  const m = code.match(/^(\d+)([A-Z]\d?)$/)
  return m
    ? `https://codeforces.com/problemset/problem/${m[1]}/${m[2]}`
    : 'https://codeforces.com/problemset'
}

/** Problem status for one user: solved / attempted / todo. */
export function statusMap(t: Tables, user_id: number): Map<string, Status> {
  const m = new Map<string, Status>()
  for (const s of t.submission) {
    if (s.user_id !== user_id) continue
    if (s.verdict === 'OK') m.set(s.problem_code, 'solved')
    else if (!m.has(s.problem_code)) m.set(s.problem_code, 'attempted')
  }
  return m
}

export function solvedSet(t: Tables, user_id: number): Set<string> {
  return new Set(
    t.submission
      .filter((s) => s.user_id === user_id && s.verdict === 'OK')
      .map((s) => s.problem_code)
  )
}

export interface LeaderRow {
  rank: number
  user_id: number
  name: string
  univ_name: string
  team_name: string | null
  solved: number
  submissions: number
}

/** v_leaderboard, ranked with rank() OVER (ORDER BY solved DESC). */
export function leaderboard(t: Tables): LeaderRow[] {
  const rows = t.app_user.map((u) => ({
    user_id: u.user_id,
    name: u.name,
    univ_name: t.university.find((x) => x.univ_id === u.univ_id)?.univ_name ?? '',
    team_name: t.team.find((x) => x.team_id === u.team_id)?.team_name ?? null,
    solved: solvedSet(t, u.user_id).size,
    submissions: t.submission.filter((s) => s.user_id === u.user_id).length,
  }))
  rows.sort((a, b) => b.solved - a.solved || a.name.localeCompare(b.name))
  return rows.map((r) => ({
    ...r,
    rank: 1 + rows.filter((x) => x.solved > r.solved).length,
  }))
}

export function topicsOf(t: Tables, code: string): Topic[] {
  const ids = new Set(
    t.problem_topic.filter((pt) => pt.problem_code === code).map((pt) => pt.topic_id)
  )
  return t.topic.filter((x) => ids.has(x.topic_id))
}

export function membersOf(t: Tables, team_id: number): AppUser[] {
  return t.app_user.filter((u) => u.team_id === team_id)
}

export function sheetProblems(t: Tables, sheet_id: number): (SheetProblem & Problem)[] {
  return t.sheet_problem
    .filter((sp) => sp.sheet_id === sheet_id)
    .sort((a, b) => a.position - b.position)
    .map((sp) => ({ ...sp, ...t.problem.find((p) => p.problem_code === sp.problem_code)! }))
}

/** v_sheet_progress for one member. */
export function sheetProgress(t: Tables, sheet_id: number, user_id: number) {
  const codes = t.sheet_problem.filter((sp) => sp.sheet_id === sheet_id)
  const solved = solvedSet(t, user_id)
  return {
    total: codes.length,
    solved: codes.filter((sp) => solved.has(sp.problem_code)).length,
  }
}

/* ================================================================= mutations */
/* Each takes the current tables and returns new ones, or throws DbError.     */

const nextId = <T,>(rows: T[], key: keyof T) =>
  rows.reduce((m, r) => Math.max(m, r[key] as number), 0) + 1

function checkUserUnique(t: Tables, u: Pick<AppUser, 'email' | 'cf_handle'>, self?: number) {
  const others = t.app_user.filter((x) => x.user_id !== self)
  if (others.some((x) => x.email.toLowerCase() === u.email.toLowerCase()))
    throw new DbError(`duplicate key value violates unique constraint "app_user_email_key"`)
  if (u.cf_handle && others.some((x) => x.cf_handle?.toLowerCase() === u.cf_handle!.toLowerCase()))
    throw new DbError(`duplicate key value violates unique constraint "app_user_cf_handle_key"`)
}

/** Trigger team_size_check: BEFORE INSERT OR UPDATE OF team_id ON app_user. */
function teamSizeCheck(t: Tables, user_id: number, team_id: number | null) {
  if (team_id == null) return
  const others = t.app_user.filter((u) => u.team_id === team_id && u.user_id !== user_id)
  if (others.length >= 3) throw new DbError(`team ${team_id} already has 3 members`)
}

export const mutations = {
  insertUser(t: Tables, u: Omit<AppUser, 'user_id'>): [Tables, number] {
    if (!u.name.trim()) throw new DbError('null value in column "name" violates not-null constraint')
    checkUserUnique(t, u)
    if (!t.university.some((x) => x.univ_id === u.univ_id))
      throw new DbError('insert on "app_user" violates foreign key constraint "app_user_univ_id_fkey"')
    const user_id = nextId(t.app_user, 'user_id')
    teamSizeCheck(t, user_id, u.team_id)
    return [{ ...t, app_user: [...t.app_user, { ...u, user_id }] }, user_id]
  },

  updateUser(t: Tables, user_id: number, patch: Partial<Omit<AppUser, 'user_id'>>): Tables {
    const cur = t.app_user.find((u) => u.user_id === user_id)!
    const next = { ...cur, ...patch }
    checkUserUnique(t, next, user_id)
    if ('team_id' in patch) teamSizeCheck(t, user_id, next.team_id)
    return { ...t, app_user: t.app_user.map((u) => (u.user_id === user_id ? next : u)) }
  },

  insertTeam(t: Tables, team_name: string): [Tables, number] {
    const name = team_name.trim()
    if (!name) throw new DbError('null value in column "team_name" violates not-null constraint')
    if (t.team.some((x) => x.team_name.toLowerCase() === name.toLowerCase()))
      throw new DbError('duplicate key value violates unique constraint "team_team_name_key"')
    const team_id = nextId(t.team, 'team_id')
    return [{ ...t, team: [...t.team, { team_id, team_name: name }] }, team_id]
  },

  /** ON DELETE SET NULL for members, ON DELETE CASCADE for sheets. */
  deleteTeam(t: Tables, team_id: number): Tables {
    const sheetIds = new Set(t.sheet.filter((s) => s.team_id === team_id).map((s) => s.sheet_id))
    return {
      ...t,
      team: t.team.filter((x) => x.team_id !== team_id),
      app_user: t.app_user.map((u) => (u.team_id === team_id ? { ...u, team_id: null } : u)),
      sheet: t.sheet.filter((s) => !sheetIds.has(s.sheet_id)),
      sheet_problem: t.sheet_problem.filter((sp) => !sheetIds.has(sp.sheet_id)),
    }
  },

  insertProblem(t: Tables, p: Problem, topic_ids: number[]): Tables {
    const code = p.problem_code.trim().toUpperCase()
    if (!/^\d+[A-Z]\d?$/.test(code)) throw new DbError('problem_code must look like 1520C')
    if (t.problem.some((x) => x.problem_code === code))
      throw new DbError(`duplicate key value violates unique constraint "problem_pkey"  Key (problem_code)=(${code}) already exists.`)
    if (!p.title.trim()) throw new DbError('null value in column "title" violates not-null constraint')
    if (p.rating != null && (p.rating < 800 || p.rating > 3500))
      throw new DbError('new row for relation "problem" violates check constraint "problem_rating_check"')
    return {
      ...t,
      problem: [...t.problem, { problem_code: code, title: p.title.trim(), rating: p.rating }],
      problem_topic: [...t.problem_topic, ...topic_ids.map((topic_id) => ({ problem_code: code, topic_id }))],
    }
  },

  insertSubmission(t: Tables, s: Submission): Tables {
    if (!t.problem.some((p) => p.problem_code === s.problem_code))
      throw new DbError('insert on "submission" violates foreign key constraint "submission_problem_code_fkey"')
    if (t.submission.some((x) => x.user_id === s.user_id && x.problem_code === s.problem_code && x.submitted_at === s.submitted_at))
      throw new DbError('duplicate key value violates unique constraint "submission_pkey"')
    return { ...t, submission: [...t.submission, s] }
  },

  insertSheet(t: Tables, s: Omit<Sheet, 'sheet_id'>, codes: string[]): [Tables, number] {
    if (!s.title.trim()) throw new DbError('null value in column "title" violates not-null constraint')
    if (new Set(codes).size !== codes.length)
      throw new DbError('duplicate key value violates unique constraint "sheet_problem_pkey"')
    const sheet_id = nextId(t.sheet, 'sheet_id')
    return [
      {
        ...t,
        sheet: [...t.sheet, { ...s, title: s.title.trim(), sheet_id }],
        sheet_problem: [...t.sheet_problem, ...codes.map((problem_code, i) => ({ sheet_id, problem_code, position: i + 1 }))],
      },
      sheet_id,
    ]
  },

  /** ON DELETE CASCADE removes the sheet's problems. */
  deleteSheet(t: Tables, sheet_id: number): Tables {
    return {
      ...t,
      sheet: t.sheet.filter((s) => s.sheet_id !== sheet_id),
      sheet_problem: t.sheet_problem.filter((sp) => sp.sheet_id !== sheet_id),
    }
  },
}

/* ====================================================================== seed */

/** SHA-256 of "password" — every sample account uses it. */
const DEMO_HASH = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'

const TOPIC_NAMES = [
  'Implementation', 'Math', 'Greedy', 'DP', 'Graphs',
  'Binary Search', 'Strings', 'Data Structures', 'Sorting', 'Number Theory',
]

// [code, title, rating, topics]
const PROBLEMS: [string, string, number, string[]][] = [
  ['4A', 'Watermelon', 800, ['Math']],
  ['71A', 'Way Too Long Words', 800, ['Strings']],
  ['158A', 'Next Round', 800, ['Implementation']],
  ['231A', 'Team', 800, ['Implementation', 'Greedy']],
  ['282A', 'Bit++', 800, ['Implementation']],
  ['263A', 'Beautiful Matrix', 800, ['Implementation']],
  ['339A', 'Helpful Maths', 800, ['Strings', 'Sorting']],
  ['266B', 'Queue at the School', 800, ['Implementation']],
  ['546A', 'Soldier and Bananas', 800, ['Math']],
  ['469A', 'I Wanna Be the Guy', 800, ['Implementation']],
  ['702A', 'Maximum Increase', 800, ['DP', 'Greedy']],
  ['580A', 'Kefa and First Steps', 900, ['DP']],
  ['115A', 'Party', 900, ['Graphs']],
  ['1A', 'Theatre Square', 1000, ['Math']],
  ['118A', 'String Task', 1000, ['Strings']],
  ['1520C', 'Not Adjacent Matrix', 1000, ['Math']],
  ['82A', 'Double Cola', 1100, ['Math', 'Implementation']],
  ['433B', "Kuriyama Mirai's Stones", 1200, ['Data Structures', 'Sorting']],
  ['189A', 'Cut Ribbon', 1300, ['DP']],
  ['230B', 'T-primes', 1300, ['Number Theory', 'Math']],
  ['4C', 'Registration System', 1300, ['Data Structures', 'Strings']],
  ['279B', 'Books', 1400, ['Binary Search']],
  ['1324D', 'Pair of Topics', 1400, ['Binary Search', 'Sorting']],
  ['1201C', 'Maximum Median', 1400, ['Binary Search', 'Greedy']],
  ['455A', 'Boredom', 1500, ['DP']],
  ['580C', 'Kefa and Park', 1500, ['Graphs']],
  ['474D', 'Flowers', 1700, ['DP']],
  ['977F', 'Consecutive Subsequence', 1700, ['DP']],
  ['339D', 'Xenia and Bit Operations', 1700, ['Data Structures']],
  ['20C', 'Dijkstra?', 1900, ['Graphs']],
  ['1547G', 'How Many Paths?', 2100, ['Graphs', 'DP']],
]

// [name, email, cf_handle, univ_id, team_id, skill 0..1]
const USERS: [string, string, string | null, number, number | null, number][] = [
  ['Saharsh Baiju', 'saharsh@am.edu', 'saharsh', 1, 1, 0.72],
  ['Anu Thomas', 'anu@am.edu', 'anu_t', 1, 1, 0.6],
  ['Rahul Menon', 'rahul@am.edu', 'rahulm', 1, 1, 0.45],
  ['Fathima K', 'fathima@nitc.ac.in', 'fathk', 2, 2, 0.8],
  ['Arjun Nair', 'arjun@nitc.ac.in', 'arjun_n', 2, 2, 0.55],
  ['Devika S', 'devika@am.edu', 'devika', 1, 3, 0.5],
  ['Nikhil Varma', 'nikhil@am.edu', 'nvarma', 1, 3, 0.38],
  ['Meenakshi R', 'meenakshi@cet.ac.in', 'meenu', 3, 4, 0.66],
  ['Joel George', 'joel@cet.ac.in', 'joelg', 3, 4, 0.42],
  ['Sneha P', 'sneha@cet.ac.in', 'sneha_p', 3, 4, 0.58],
  ['Aditya Rao', 'aditya@nitc.ac.in', null, 2, null, 0.3],
  ['Riya Joseph', 'riya@am.edu', 'riyaj', 1, null, 0.48],
]

// [team_id, title, deadline offset in days, problem codes in order]
const SHEETS: [number, string, number, string[]][] = [
  [1, 'Binary Search Ladder', 3, ['279B', '1324D', '1201C']],
  [1, 'DP Warm-up', 10, ['580A', '189A', '455A', '977F', '474D']],
  [2, 'Graphs 101', 14, ['115A', '580C', '20C', '1547G']],
  [3, 'Div. 2 A Sprint', -2, ['4A', '71A', '158A', '231A', '282A']],
  [4, 'Number Theory Basics', 20, ['1A', '82A', '230B']],
]

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let x = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

const isoDate = (d: Date) => d.toISOString().slice(0, 10)

export function seed(now = new Date()): Tables {
  const rand = mulberry32(1729)
  const topic = TOPIC_NAMES.map((topic_name, i) => ({ topic_id: i + 1, topic_name }))
  const topicId = (n: string) => topic.find((x) => x.topic_name === n)!.topic_id

  const problem = PROBLEMS.map(([problem_code, title, rating]) => ({ problem_code, title, rating }))
  const problem_topic = PROBLEMS.flatMap(([problem_code, , , ts]) =>
    ts.map((n) => ({ problem_code, topic_id: topicId(n) }))
  )

  const app_user = USERS.map(([name, email, cf_handle, univ_id, team_id], i) => ({
    user_id: i + 1, name, email, password_hash: DEMO_HASH, cf_handle, univ_id, team_id,
  }))

  /* Submissions over the last 45 days: stronger students try harder problems
     and need fewer attempts. Every timestamp is unique per user. */
  const submission: Submission[] = []
  USERS.forEach(([, , , , , skill], i) => {
    const user_id = i + 1
    for (const [code, , rating] of PROBLEMS) {
      const reach = skill * 2400 + 600
      if (rating > reach + 200 || rand() > 0.15 + skill * 0.55) continue
      const lang = LANGUAGES[Math.floor(rand() * 3)]
      let at = now.getTime() - Math.floor(rand() * 45 * 864e5) - 36e5
      const ease = Math.max(0.15, 1 - (rating - 800) / (reach + 400))
      const tries = 1 + Math.floor(rand() * 3)
      for (let k = 0; k < tries; k++) {
        const last = k === tries - 1
        const verdict: Verdict = last && rand() < ease + 0.3
          ? 'OK'
          : (['WRONG_ANSWER', 'WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED', 'RUNTIME_ERROR'] as const)[Math.floor(rand() * 4)]
        at += Math.floor(rand() * 40 + 3) * 6e4
        if (at > now.getTime()) at = now.getTime() - (tries - k) * 6e4
        submission.push({
          user_id, problem_code: code,
          submitted_at: new Date(Math.floor(at / 1000) * 1000).toISOString(),
          verdict, language: lang,
        })
      }
    }
  })

  const sheet: Sheet[] = []
  const sheet_problem: SheetProblem[] = []
  SHEETS.forEach(([team_id, title, offset, codes], i) => {
    const sheet_id = i + 1
    sheet.push({ sheet_id, title, team_id, deadline: isoDate(new Date(now.getTime() + offset * 864e5)) })
    codes.forEach((problem_code, j) => sheet_problem.push({ sheet_id, problem_code, position: j + 1 }))
  })

  return {
    university: [
      { univ_id: 1, univ_name: 'Amrita Vishwa Vidyapeetham', city: 'Amritapuri' },
      { univ_id: 2, univ_name: 'NIT Calicut', city: 'Kozhikode' },
      { univ_id: 3, univ_name: 'College of Engineering Trivandrum', city: 'Thiruvananthapuram' },
    ],
    team: [
      { team_id: 1, team_name: 'Segfault Survivors' },
      { team_id: 2, team_name: 'Off By One' },
      { team_id: 3, team_name: 'Null Pointers' },
      { team_id: 4, team_name: 'Stack Smashers' },
      { team_id: 5, team_name: 'Lazy Propagation' },
    ],
    app_user, topic, problem, problem_topic, submission, sheet, sheet_problem,
  }
}

/* ================================================================== provider */

const STORAGE_KEY = 'o1.lite.db.v2'

function load(): Tables {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Tables
  } catch {
    /* fall through to a fresh seed */
  }
  return seed()
}

interface DbState {
  t: Tables
  /** Apply a mutation; returns the DB error message, or null on success. */
  run: (fn: (t: Tables) => Tables) => string | null
  reset: () => void
}

const DbContext = React.createContext<DbState | null>(null)

export function DbProvider({ children }: { children: React.ReactNode }) {
  const [t, setT] = React.useState<Tables>(load)
  const ref = React.useRef(t)
  ref.current = t

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(t))
    } catch {
      /* storage full or blocked — keep the session copy */
    }
  }, [t])

  const value = React.useMemo<DbState>(
    () => ({
      t,
      run: (fn) => {
        try {
          const next = fn(ref.current)
          ref.current = next
          setT(next)
          return null
        } catch (e) {
          if (e instanceof DbError) return e.message
          throw e
        }
      },
      reset: () => setT(seed()),
    }),
    [t]
  )

  return <DbContext.Provider value={value}>{children}</DbContext.Provider>
}

export function useDb() {
  const ctx = React.useContext(DbContext)
  if (!ctx) throw new Error('useDb must be used inside <DbProvider>')
  return ctx
}

export async function sha256(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
