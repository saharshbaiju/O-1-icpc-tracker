import { useCallback, useEffect, useState } from 'react'

/* ------------------------------------------------------------------ types */
/* Shapes of the JSON the Flask backend returns (backend/routes/*.py).     */

export type Difficulty = 'Easy' | 'Medium' | 'Hard'
export type Status = 'solved' | 'attempted' | 'todo'

export const VERDICTS = [
  'OK',
  'WRONG_ANSWER',
  'TIME_LIMIT_EXCEEDED',
  'RUNTIME_ERROR',
  'MEMORY_LIMIT_EXCEEDED',
  'COMPILATION_ERROR',
] as const
export type Verdict = (typeof VERDICTS)[number]

export const LANGUAGES = ['C++17', 'C++20', 'Python 3', 'PyPy 3', 'Java 21', 'Kotlin']

export interface User {
  user_id: number
  name: string
  email: string
  cf_handle: string | null
  cf_rating: number | null
  cf_max_rating: number | null
  univ_id: number
  univ_name: string
  team_id: number | null
  team_name: string | null
}

export interface University {
  univ_id: number
  univ_name: string
  city: string
}

export interface UniversityMatch extends University {
  score: number
}

/** A problem from the Codeforces problemset (GET /api/codeforces/problems). */
export interface CfProblem {
  problem_code: string
  title: string
  rating: number | null
  tags: string[]
  solved_count: number
}

export interface MemberStats {
  user_id: number
  name: string
  cf_handle: string | null
  cf_rating: number | null
  cf_max_rating: number | null
  solved: number
  solved_30d: number
  active_days_30: number
  current_streak: number
  longest_streak: number
  acceptance: number | null
  avg_solved_rating: number | null
  hardest_solved: number | null
  unique_solves: number
}

export interface TeamAnalytics {
  members: MemberStats[]
  weeks: string[] // Monday of each of the last 12 weeks
  weekly: Record<string, number[]> // user_id -> problems first solved each week
  topics: { user_id: number; topic_name: string; solved: number }[]
}

export interface Topic {
  topic_id: number
  topic_name: string
}

export interface ProblemRow {
  problem_code: string
  title: string
  rating: number | null
  difficulty: Difficulty | null
  topics: string[]
  status: Status
}

export interface SubmissionRow {
  submitted_at: string
  user_id: number
  name: string
  problem_code: string
  title: string
  language: string
  verdict: Verdict
}

export interface SheetSummary {
  sheet_id: number
  title: string
  deadline: string | null
  total: number
  solved: number
}

export interface SheetDetail {
  sheet_id: number
  title: string
  team_id: number
  deadline: string | null
  problems: { position: number; problem_code: string; title: string; rating: number | null; difficulty: Difficulty | null }[]
  members: { user_id: number; name: string; solved: number; total: number }[]
  attempts: { user_id: number; problem_code: string; status: Status }[]
}

export interface TeamRow {
  team_id: number
  team_name: string
  members: number
  member_names: string
  solved: number
}

export interface MyTeam {
  team_id: number
  team_name: string
  solved: number
  sheets: number
  members: { user_id: number; name: string; cf_handle: string | null; univ_name: string; solved: number }[]
}

export interface LeaderRow {
  rank: number
  user_id: number
  name: string
  univ_name: string
  team_name: string | null
  solved: number
}

export interface Dashboard {
  stats: {
    solved: number
    submissions: number
    acceptance: number
    rank: number
    players: number
    problems: number
  }
  up_next: { sheet_id: number; sheet_title: string; position: number; problem_code: string; title: string; rating: number | null }[]
  recent: { submitted_at: string; problem_code: string; title: string; language: string; verdict: Verdict }[]
  by_topic: { topic_name: string; total: number; solved: number }[]
  by_difficulty: { difficulty: Difficulty; total: number; solved: number }[]
  sheets: SheetSummary[]
}

/* ---------------------------------------------------------------- requests */

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'same-origin',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const message =
      data?.error ?? (res.status >= 500 ? 'The server is not responding. Is the Flask backend running?' : res.statusText)
    throw new ApiError(message, res.status)
  }
  return data as T
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T = unknown>(path: string, body: unknown = {}) => request<T>('POST', path, body),
  put: <T = unknown>(path: string, body: unknown) => request<T>('PUT', path, body),
  del: <T = unknown>(path: string) => request<T>('DELETE', path),
}

/** Run a request and return its error message (or null), for form handlers. */
export async function attempt(fn: () => Promise<unknown>): Promise<string | null> {
  try {
    await fn()
    return null
  } catch (e) {
    return e instanceof Error ? e.message : String(e)
  }
}

/** GET `path` when the component mounts (and whenever `path` changes). */
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(path !== null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (path === null) return
    let cancelled = false
    setLoading(true)
    setError(null) // don't keep showing the previous request's error while retrying
    api
      .get<T>(path)
      .then((d) => !cancelled && (setData(d), setError(null)))
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [path, version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])
  return { data, error, loading, reload }
}

export function problemUrl(code: string) {
  const m = code.match(/^(\d+)([A-Z]\d?)$/)
  if (!m) return 'https://codeforces.com/problemset'
  // Contest ids above 100000 are Gym contests.
  return Number(m[1]) >= 100000
    ? `https://codeforces.com/gym/${m[1]}/problem/${m[2]}`
    : `https://codeforces.com/problemset/problem/${m[1]}/${m[2]}`
}

/**
 * Codeforces refuses to be shown inside other sites (X-Frame-Options),
 * so instead we open it in a window placed beside this one. Every problem
 * reuses the same window.
 */
export function openBeside(url: string) {
  const width = Math.round(window.screen.availWidth / 2)
  const height = window.screen.availHeight
  const win = window.open(url, 'o1-codeforces', `width=${width},height=${height},left=${width},top=0`)
  win?.focus()
}
