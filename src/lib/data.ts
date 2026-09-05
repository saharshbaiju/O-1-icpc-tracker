/**
 * Mock data for the O(1) ICPC tracker UI.
 *
 * Everything here is deterministic (seeded PRNG) so screenshots and
 * charts stay stable between renders. Pages should import from here
 * rather than inventing their own core entities.
 */

/* ------------------------------------------------------------------ */
/* Seeded randomness                                                   */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(20260726)

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type Role = 'student' | 'mentor'

export type Platform =
  | 'Codeforces'
  | 'CodeChef'
  | 'LeetCode'
  | 'AtCoder'
  | 'SPOJ'
  | 'HackerRank'

export type Difficulty = 'Easy' | 'Medium' | 'Hard'

export type ProblemStatus = 'solved' | 'attempted' | 'todo'

export interface User {
  id: string
  name: string
  handle: string
  email: string
  role: Role
  avatar: string
  rating: number
  maxRating: number
  rank: string
  xp: number
  level: number
  streak: number
  solved: number
  college: string
  year: string
  country: string
  joinedAt: string
  bio: string
  platforms: { platform: Platform; handle: string; rating: number }[]
}

export interface Problem {
  id: string
  code: string
  title: string
  platform: Platform
  difficulty: Difficulty
  rating: number
  topics: string[]
  tags: string[]
  acceptance: number
  solvedBy: number
  status: ProblemStatus
  hasEditorial: boolean
  hints: number
  discussions: number
  url: string
}

export interface Sheet {
  id: string
  title: string
  description: string
  author: string
  authorRole: Role
  topics: string[]
  total: number
  completed: number
  deadline: string
  difficulty: Difficulty
  assigned: number
  color: string
}

export interface Contest {
  id: string
  name: string
  type: 'Virtual' | 'Live' | 'Mock ICPC' | 'Practice'
  platform: Platform | 'O(1)'
  startsAt: string
  durationMins: number
  participants: number
  status: 'upcoming' | 'live' | 'ended'
  problems: number
  rank?: number
  solved?: number
}

export interface TeamMember {
  id: string
  name: string
  handle: string
  avatar: string
  role: string
  rating: number
}

export interface Team {
  id: string
  name: string
  university: string
  rank: number
  rating: number
  contests: number
  solved: number
  members: TeamMember[]
  coach: string
  createdAt: string
}

export interface Resource {
  id: string
  title: string
  type: 'Article' | 'Video' | 'Notes' | 'Roadmap' | 'Tutorial' | 'Book'
  topic: string
  author: string
  duration: string
  level: Difficulty
  bookmarked: boolean
  views: number
}

export interface CalendarEvent {
  id: string
  title: string
  type: 'contest' | 'practice' | 'deadline' | 'session' | 'announcement'
  date: string
  time: string
  durationMins: number
}

export interface LeaderboardEntry {
  id: string
  rank: number
  delta: number
  name: string
  handle: string
  avatar: string
  team: string
  university: string
  rating: number
  solved: number
  contests: number
  streak: number
  xp: number
}

export interface ActivityItem {
  id: string
  kind: 'solved' | 'contest' | 'badge' | 'sheet' | 'team' | 'comment'
  text: string
  detail: string
  time: string
}

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

export const PLATFORMS: Platform[] = [
  'Codeforces',
  'CodeChef',
  'LeetCode',
  'AtCoder',
  'SPOJ',
  'HackerRank',
]

export const DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard']

export const TOPICS = [
  'Graphs',
  'Dynamic Programming',
  'Greedy',
  'Number Theory',
  'Data Structures',
  'Strings',
  'Geometry',
  'Trees',
  'Binary Search',
  'Combinatorics',
  'Flows',
  'Game Theory',
  'Bitmask',
  'Segment Tree',
  'Two Pointers',
  'Math',
]

export const ROLE_LABEL: Record<Role, string> = {
  student: 'Student',
  mentor: 'Mentor',
}

const AVATAR = (seed: string) =>
  `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(
    seed
  )}&backgroundColor=6d28d9,7c3aed,4c1d95,312e81&radius=50`

/* ------------------------------------------------------------------ */
/* Current user                                                        */
/* ------------------------------------------------------------------ */

export const currentUser: User = {
  id: 'u-001',
  name: 'Saharsh Baiju',
  handle: 'saharsh_b',
  email: 'iqbal1729@gmail.com',
  role: 'student',
  avatar: AVATAR('saharsh'),
  rating: 1847,
  maxRating: 1912,
  rank: 'Expert',
  xp: 12480,
  level: 24,
  streak: 47,
  solved: 862,
  college: 'National Institute of Technology',
  year: '3rd Year',
  country: 'India',
  joinedAt: 'Jan 2024',
  bio: 'ICPC aspirant. Graph theory enthusiast. Currently grinding DP on trees and flows.',
  platforms: [
    { platform: 'Codeforces', handle: 'saharsh_b', rating: 1847 },
    { platform: 'CodeChef', handle: 'saharsh_b', rating: 1923 },
    { platform: 'LeetCode', handle: 'saharshb', rating: 2104 },
    { platform: 'AtCoder', handle: 'saharsh', rating: 1502 },
  ],
}

/* ------------------------------------------------------------------ */
/* People                                                              */
/* ------------------------------------------------------------------ */

const NAMES = [
  'Aarav Mehta',
  'Ishita Rao',
  'Kabir Nair',
  'Ananya Ghosh',
  'Rohan Verma',
  'Meera Iyer',
  'Vikram Sethi',
  'Priya Chandra',
  'Arjun Kapoor',
  'Sneha Pillai',
  'Dhruv Malhotra',
  'Tanvi Deshmukh',
  'Karthik Reddy',
  'Nisha Bansal',
  'Aditya Joshi',
  'Riya Sharma',
  'Siddharth Menon',
  'Pooja Krishnan',
  'Neel Trivedi',
  'Lakshmi Varma',
]

const UNIVERSITIES = [
  'IIT Bombay',
  'NIT Trichy',
  'IIIT Hyderabad',
  'BITS Pilani',
  'IIT Delhi',
  'NIT Surathkal',
  'IIIT Bangalore',
  'IIT Kanpur',
]

const RANKS = [
  'Newbie',
  'Pupil',
  'Specialist',
  'Expert',
  'Candidate Master',
  'Master',
  'Grandmaster',
]

function rankFor(rating: number) {
  if (rating < 1200) return RANKS[0]
  if (rating < 1400) return RANKS[1]
  if (rating < 1600) return RANKS[2]
  if (rating < 1900) return RANKS[3]
  if (rating < 2100) return RANKS[4]
  if (rating < 2400) return RANKS[5]
  return RANKS[6]
}

export function ratingColor(rating: number) {
  if (rating < 1200) return 'text-muted-foreground'
  if (rating < 1400) return 'text-success'
  if (rating < 1600) return 'text-chart-3'
  if (rating < 1900) return 'text-primary'
  if (rating < 2100) return 'text-chart-4'
  if (rating < 2400) return 'text-warning'
  return 'text-destructive'
}

export const people: User[] = NAMES.map((name, i) => {
  const rating = 1100 + Math.floor(rand() * 1400)
  const handle = name.toLowerCase().replace(/[^a-z]/g, '_').slice(0, 12)
  return {
    id: `u-${String(i + 10).padStart(3, '0')}`,
    name,
    handle,
    email: `${handle}@example.com`,
    role: i < 3 ? 'mentor' : 'student',
    avatar: AVATAR(name),
    rating,
    maxRating: rating + Math.floor(rand() * 180),
    rank: rankFor(rating),
    xp: 3000 + Math.floor(rand() * 20000),
    level: 8 + Math.floor(rand() * 30),
    streak: Math.floor(rand() * 90),
    solved: 200 + Math.floor(rand() * 1400),
    college: UNIVERSITIES[i % UNIVERSITIES.length],
    year: ['1st Year', '2nd Year', '3rd Year', '4th Year'][i % 4],
    country: 'India',
    joinedAt: 'Feb 2024',
    bio: 'Competitive programmer focused on ICPC regionals.',
    platforms: [
      { platform: 'Codeforces', handle, rating },
      { platform: 'CodeChef', handle, rating: rating + 90 },
    ],
  }
})

export const mentors = people.filter((p) => p.role === 'mentor')

/* ------------------------------------------------------------------ */
/* Problems                                                           */
/* ------------------------------------------------------------------ */

const PROBLEM_TITLES = [
  'Shortest Path Queries',
  'Tree Painting',
  'Minimum Spanning Subgraph',
  'Palindromic Substrings',
  'Knapsack Reloaded',
  'Bitwise Xor Sum',
  'Cyclic Permutations',
  'Maximum Flow Network',
  'Convex Hull Trick',
  'Digit DP Counting',
  'Segment Tree Beats',
  'Lowest Common Ancestor',
  'String Matching Automaton',
  'Matrix Exponentiation',
  'Interval Scheduling',
  'Two Pointer Subarray',
  'Modular Inverse Sum',
  'Grid Path Counting',
  'Heavy Light Traversal',
  'Game of Stones',
  'Suffix Array Sort',
  'Bipartite Matching',
  'Range Update Query',
  'Prime Factor Sieve',
  'Coin Change Variants',
  'Longest Increasing Path',
  'Trie Word Search',
  'Meet in the Middle',
  'Sparse Table Queries',
  'Topological Ordering',
  'Articulation Points',
  'Kth Smallest Element',
  'Nim Sum Strategy',
  'Euler Tour Technique',
  'Rolling Hash Compare',
  'Centroid Decomposition',
]

export const problems: Problem[] = PROBLEM_TITLES.map((title, i) => {
  const platform = PLATFORMS[i % PLATFORMS.length]
  const rating = 800 + Math.floor(rand() * 24) * 100
  const difficulty: Difficulty =
    rating < 1400 ? 'Easy' : rating < 2000 ? 'Medium' : 'Hard'
  const statusRoll = rand()
  return {
    id: `p-${String(i + 1).padStart(3, '0')}`,
    code: `${String.fromCharCode(65 + (i % 8))}${1200 + i * 7}`,
    title,
    platform,
    difficulty,
    rating,
    topics: [TOPICS[i % TOPICS.length], TOPICS[(i * 5 + 3) % TOPICS.length]],
    tags: [
      TOPICS[(i * 3) % TOPICS.length].toLowerCase().replace(/ /g, '-'),
      ['implementation', 'constructive', 'sortings', 'brute-force', 'dsu'][i % 5],
    ],
    acceptance: Math.round((25 + rand() * 60) * 10) / 10,
    solvedBy: 400 + Math.floor(rand() * 18000),
    status:
      statusRoll > 0.62 ? 'solved' : statusRoll > 0.42 ? 'attempted' : 'todo',
    hasEditorial: rand() > 0.25,
    hints: Math.floor(rand() * 4),
    discussions: Math.floor(rand() * 90),
    url: '#',
  }
})

/* ------------------------------------------------------------------ */
/* Practice sheets                                                     */
/* ------------------------------------------------------------------ */

export const sheets: Sheet[] = [
  {
    id: 's-01',
    title: 'Graph Theory Foundations',
    description:
      'BFS, DFS, shortest paths, and connectivity — the backbone of every regional set.',
    author: 'Aarav Mehta',
    authorRole: 'mentor',
    topics: ['Graphs', 'Trees', 'Data Structures'],
    total: 45,
    completed: 32,
    deadline: '2026-08-04',
    difficulty: 'Medium',
    assigned: 128,
    color: 'chart-1',
  },
  {
    id: 's-02',
    title: 'DP Ladder — Beginner to Regional',
    description:
      'Fifty problems that walk from 1D knapsack to tree DP and digit DP.',
    author: 'Ishita Rao',
    authorRole: 'mentor',
    topics: ['Dynamic Programming', 'Bitmask'],
    total: 50,
    completed: 18,
    deadline: '2026-08-12',
    difficulty: 'Hard',
    assigned: 96,
    color: 'chart-2',
  },
  {
    id: 's-03',
    title: 'Number Theory Essentials',
    description: 'Sieves, modular arithmetic, CRT, and multiplicative functions.',
    author: 'Kabir Nair',
    authorRole: 'mentor',
    topics: ['Number Theory', 'Math'],
    total: 30,
    completed: 30,
    deadline: '2026-07-22',
    difficulty: 'Medium',
    assigned: 74,
    color: 'chart-3',
  },
  {
    id: 's-04',
    title: 'Segment Trees & Lazy Propagation',
    description: 'Range queries, lazy updates, and segment tree beats.',
    author: 'Aarav Mehta',
    authorRole: 'mentor',
    topics: ['Segment Tree', 'Data Structures'],
    total: 28,
    completed: 9,
    deadline: '2026-08-20',
    difficulty: 'Hard',
    assigned: 61,
    color: 'chart-4',
  },
  {
    id: 's-05',
    title: 'Strings: Hashing to Suffix Automata',
    description: 'Z-function, KMP, hashing, tries, and suffix structures.',
    author: 'Ishita Rao',
    authorRole: 'mentor',
    topics: ['Strings'],
    total: 34,
    completed: 21,
    deadline: '2026-08-28',
    difficulty: 'Medium',
    assigned: 53,
    color: 'chart-5',
  },
  {
    id: 's-06',
    title: 'Greedy & Ad-hoc Warmups',
    description: 'Daily short problems to keep the reflexes sharp.',
    author: 'Kabir Nair',
    authorRole: 'mentor',
    topics: ['Greedy', 'Two Pointers'],
    total: 40,
    completed: 37,
    deadline: '2026-07-30',
    difficulty: 'Easy',
    assigned: 210,
    color: 'chart-1',
  },
]

/* ------------------------------------------------------------------ */
/* Contests                                                            */
/* ------------------------------------------------------------------ */

export const contests: Contest[] = [
  {
    id: 'c-01',
    name: 'ICPC Amritapuri Mock Round 7',
    type: 'Mock ICPC',
    platform: 'O(1)',
    startsAt: '2026-07-27T18:00:00',
    durationMins: 300,
    participants: 428,
    status: 'upcoming',
    problems: 11,
  },
  {
    id: 'c-02',
    name: 'Codeforces Round 998 (Div. 2)',
    type: 'Live',
    platform: 'Codeforces',
    startsAt: '2026-07-28T20:05:00',
    durationMins: 120,
    participants: 24610,
    status: 'upcoming',
    problems: 6,
  },
  {
    id: 'c-03',
    name: 'Weekly Practice — Graphs',
    type: 'Virtual',
    platform: 'O(1)',
    startsAt: '2026-07-26T21:00:00',
    durationMins: 150,
    participants: 87,
    status: 'live',
    problems: 7,
  },
  {
    id: 'c-04',
    name: 'CodeChef Starters 178',
    type: 'Live',
    platform: 'CodeChef',
    startsAt: '2026-07-29T20:00:00',
    durationMins: 180,
    participants: 12840,
    status: 'upcoming',
    problems: 8,
  },
  {
    id: 'c-05',
    name: 'ICPC Regionals Simulation #4',
    type: 'Mock ICPC',
    platform: 'O(1)',
    startsAt: '2026-07-19T17:00:00',
    durationMins: 300,
    participants: 356,
    status: 'ended',
    problems: 12,
    rank: 24,
    solved: 7,
  },
  {
    id: 'c-06',
    name: 'AtCoder Beginner Contest 402',
    type: 'Live',
    platform: 'AtCoder',
    startsAt: '2026-07-18T17:30:00',
    durationMins: 100,
    participants: 9820,
    status: 'ended',
    problems: 7,
    rank: 612,
    solved: 5,
  },
  {
    id: 'c-07',
    name: 'DP Speedrun Virtual',
    type: 'Virtual',
    platform: 'O(1)',
    startsAt: '2026-07-14T19:00:00',
    durationMins: 120,
    participants: 64,
    status: 'ended',
    problems: 6,
    rank: 8,
    solved: 5,
  },
  {
    id: 'c-08',
    name: 'Team Relay — Round 3',
    type: 'Practice',
    platform: 'O(1)',
    startsAt: '2026-07-11T18:30:00',
    durationMins: 180,
    participants: 42,
    status: 'ended',
    problems: 9,
    rank: 3,
    solved: 8,
  },
]

export const upcomingContests = contests.filter((c) => c.status !== 'ended')

/* ------------------------------------------------------------------ */
/* Teams                                                               */
/* ------------------------------------------------------------------ */

function memberFrom(u: User, role: string): TeamMember {
  return {
    id: u.id,
    name: u.name,
    handle: u.handle,
    avatar: u.avatar,
    role,
    rating: u.rating,
  }
}

export const myTeam: Team = {
  id: 't-01',
  name: 'Segfault Sentinels',
  university: 'National Institute of Technology',
  rank: 12,
  rating: 2140,
  contests: 18,
  solved: 143,
  coach: 'Prof. R. Subramanian',
  createdAt: 'Mar 2025',
  members: [
    {
      id: currentUser.id,
      name: currentUser.name,
      handle: currentUser.handle,
      avatar: currentUser.avatar,
      role: 'Captain · Graphs',
      rating: currentUser.rating,
    },
    memberFrom(people[3], 'DP & Math'),
    memberFrom(people[4], 'Geometry & Strings'),
  ],
}

export const teams: Team[] = [
  myTeam,
  {
    id: 't-02',
    name: 'Recursive Descent',
    university: 'IIT Bombay',
    rank: 1,
    rating: 2680,
    contests: 24,
    solved: 219,
    coach: 'Dr. A. Krishnan',
    createdAt: 'Jan 2025',
    members: [
      memberFrom(people[5], 'Captain'),
      memberFrom(people[6], 'Flows'),
      memberFrom(people[7], 'Number Theory'),
    ],
  },
  {
    id: 't-03',
    name: 'Amortized Chaos',
    university: 'IIIT Hyderabad',
    rank: 2,
    rating: 2604,
    contests: 22,
    solved: 205,
    coach: 'Dr. S. Banerjee',
    createdAt: 'Feb 2025',
    members: [
      memberFrom(people[8], 'Captain'),
      memberFrom(people[9], 'Data Structures'),
      memberFrom(people[10], 'Geometry'),
    ],
  },
  {
    id: 't-04',
    name: 'Null Pointer Exception',
    university: 'BITS Pilani',
    rank: 5,
    rating: 2418,
    contests: 19,
    solved: 178,
    coach: 'Prof. M. Dutta',
    createdAt: 'Apr 2025',
    members: [
      memberFrom(people[11], 'Captain'),
      memberFrom(people[12], 'DP'),
      memberFrom(people[13], 'Strings'),
    ],
  },
  {
    id: 't-05',
    name: 'Binary Searchers',
    university: 'NIT Trichy',
    rank: 8,
    rating: 2295,
    contests: 16,
    solved: 156,
    coach: 'Prof. V. Ramesh',
    createdAt: 'May 2025',
    members: [
      memberFrom(people[14], 'Captain'),
      memberFrom(people[15], 'Greedy'),
      memberFrom(people[16], 'Trees'),
    ],
  },
]

/* ------------------------------------------------------------------ */
/* Resources                                                           */
/* ------------------------------------------------------------------ */

export const resources: Resource[] = [
  {
    id: 'r-01',
    title: 'Graph Algorithms: A Visual Walkthrough',
    type: 'Video',
    topic: 'Graphs',
    author: 'Aarav Mehta',
    duration: '48 min',
    level: 'Medium',
    bookmarked: true,
    views: 12400,
  },
  {
    id: 'r-02',
    title: 'The Complete DP Roadmap',
    type: 'Roadmap',
    topic: 'Dynamic Programming',
    author: 'Ishita Rao',
    duration: '12 weeks',
    level: 'Hard',
    bookmarked: true,
    views: 8930,
  },
  {
    id: 'r-03',
    title: 'Modular Arithmetic Cheat Sheet',
    type: 'Notes',
    topic: 'Number Theory',
    author: 'Kabir Nair',
    duration: '9 min read',
    level: 'Easy',
    bookmarked: false,
    views: 15600,
  },
  {
    id: 'r-04',
    title: 'Segment Trees from First Principles',
    type: 'Article',
    topic: 'Segment Tree',
    author: 'Aarav Mehta',
    duration: '22 min read',
    level: 'Hard',
    bookmarked: false,
    views: 7210,
  },
  {
    id: 'r-05',
    title: 'String Hashing Without Collisions',
    type: 'Tutorial',
    topic: 'Strings',
    author: 'Ishita Rao',
    duration: '31 min',
    level: 'Medium',
    bookmarked: true,
    views: 5480,
  },
  {
    id: 'r-06',
    title: 'Competitive Programmer’s Handbook',
    type: 'Book',
    topic: 'Math',
    author: 'Antti Laaksonen',
    duration: '296 pages',
    level: 'Medium',
    bookmarked: true,
    views: 42100,
  },
  {
    id: 'r-07',
    title: 'Max Flow / Min Cut Explained',
    type: 'Video',
    topic: 'Flows',
    author: 'Kabir Nair',
    duration: '54 min',
    level: 'Hard',
    bookmarked: false,
    views: 6340,
  },
  {
    id: 'r-08',
    title: 'Binary Search on the Answer',
    type: 'Article',
    topic: 'Binary Search',
    author: 'Aarav Mehta',
    duration: '14 min read',
    level: 'Easy',
    bookmarked: false,
    views: 19800,
  },
  {
    id: 'r-09',
    title: 'Geometry Primitives You Actually Need',
    type: 'Notes',
    topic: 'Geometry',
    author: 'Ishita Rao',
    duration: '17 min read',
    level: 'Hard',
    bookmarked: false,
    views: 4120,
  },
]

/* ------------------------------------------------------------------ */
/* Calendar                                                            */
/* ------------------------------------------------------------------ */

export const calendarEvents: CalendarEvent[] = [
  {
    id: 'e-01',
    title: 'Weekly Practice — Graphs',
    type: 'contest',
    date: '2026-07-26',
    time: '21:00',
    durationMins: 150,
  },
  {
    id: 'e-02',
    title: 'ICPC Amritapuri Mock Round 7',
    type: 'contest',
    date: '2026-07-27',
    time: '18:00',
    durationMins: 300,
  },
  {
    id: 'e-03',
    title: 'Mentor session with Aarav',
    type: 'session',
    date: '2026-07-28',
    time: '17:00',
    durationMins: 60,
  },
  {
    id: 'e-04',
    title: 'Codeforces Round 998 (Div. 2)',
    type: 'contest',
    date: '2026-07-28',
    time: '20:05',
    durationMins: 120,
  },
  {
    id: 'e-05',
    title: 'CodeChef Starters 178',
    type: 'contest',
    date: '2026-07-29',
    time: '20:00',
    durationMins: 180,
  },
  {
    id: 'e-06',
    title: 'Team standup — Segfault Sentinels',
    type: 'session',
    date: '2026-07-30',
    time: '19:00',
    durationMins: 30,
  },
  {
    id: 'e-07',
    title: 'Greedy Warmups due',
    type: 'deadline',
    date: '2026-07-30',
    time: '23:59',
    durationMins: 0,
  },
  {
    id: 'e-08',
    title: 'Graph Theory Foundations due',
    type: 'deadline',
    date: '2026-08-04',
    time: '23:59',
    durationMins: 0,
  },
  {
    id: 'e-09',
    title: 'Regional registration closes',
    type: 'announcement',
    date: '2026-08-08',
    time: '12:00',
    durationMins: 0,
  },
  {
    id: 'e-10',
    title: 'DP Ladder due',
    type: 'deadline',
    date: '2026-08-12',
    time: '23:59',
    durationMins: 0,
  },
  {
    id: 'e-11',
    title: 'Practice: Segment Trees',
    type: 'practice',
    date: '2026-08-02',
    time: '20:00',
    durationMins: 90,
  },
]

/* ------------------------------------------------------------------ */
/* Leaderboard                                                         */
/* ------------------------------------------------------------------ */

export const leaderboard: LeaderboardEntry[] = people
  .slice(0, 14)
  .map((p, i) => ({
    id: p.id,
    rank: i + 1,
    delta: Math.floor(rand() * 9) - 4,
    name: p.name,
    handle: p.handle,
    avatar: p.avatar,
    team: teams[i % teams.length].name,
    university: p.college,
    rating: 2600 - i * 47 - Math.floor(rand() * 20),
    solved: 1600 - i * 63,
    contests: 40 - i,
    streak: 90 - i * 4,
    xp: 40000 - i * 1800,
  }))
  .sort((a, b) => b.rating - a.rating)
  .map((e, i) => ({ ...e, rank: i + 1 }))

export const myLeaderboardEntry: LeaderboardEntry = {
  id: currentUser.id,
  rank: 27,
  delta: 4,
  name: currentUser.name,
  handle: currentUser.handle,
  avatar: currentUser.avatar,
  team: myTeam.name,
  university: currentUser.college,
  rating: currentUser.rating,
  solved: currentUser.solved,
  contests: 18,
  streak: currentUser.streak,
  xp: currentUser.xp,
}

/* ------------------------------------------------------------------ */
/* Activity feed                                                       */
/* ------------------------------------------------------------------ */

export const activity: ActivityItem[] = [
  {
    id: 'ac-1',
    kind: 'solved',
    text: 'Solved Heavy Light Traversal',
    detail: 'Codeforces · 2100 · Trees',
    time: '18m ago',
  },
  {
    id: 'ac-2',
    kind: 'badge',
    text: 'Unlocked Persistent',
    detail: '45-day streak · +250 XP',
    time: '3h ago',
  },
  {
    id: 'ac-3',
    kind: 'sheet',
    text: 'Completed 4 problems in Graph Theory Foundations',
    detail: '32 / 45 done',
    time: '5h ago',
  },
  {
    id: 'ac-4',
    kind: 'contest',
    text: 'Placed 8th in DP Speedrun Virtual',
    detail: '5 / 6 solved · +31 rating',
    time: '2d ago',
  },
  {
    id: 'ac-5',
    kind: 'comment',
    text: 'Answered “Intuition behind Segment Tree Beats?”',
    detail: '12 upvotes',
    time: '3d ago',
  },
  {
    id: 'ac-6',
    kind: 'team',
    text: 'Ananya Ghosh joined Segfault Sentinels',
    detail: 'Team is now full',
    time: '4d ago',
  },
]

/* ------------------------------------------------------------------ */
/* Charts                                                              */
/* ------------------------------------------------------------------ */

export const ratingHistory = [
  { date: 'Feb', rating: 1204, contest: 'Div 3 Round 912' },
  { date: 'Mar', rating: 1332, contest: 'Div 2 Round 918' },
  { date: 'Apr', rating: 1298, contest: 'Educational 168' },
  { date: 'May', rating: 1451, contest: 'Div 2 Round 931' },
  { date: 'Jun', rating: 1587, contest: 'Div 2 Round 944' },
  { date: 'Jul', rating: 1543, contest: 'Educational 173' },
  { date: 'Aug', rating: 1666, contest: 'Div 2 Round 958' },
  { date: 'Sep', rating: 1742, contest: 'Div 1 + 2 Round 962' },
  { date: 'Oct', rating: 1701, contest: 'Educational 179' },
  { date: 'Nov', rating: 1809, contest: 'Div 2 Round 981' },
  { date: 'Dec', rating: 1912, contest: 'Div 2 Round 989' },
  { date: 'Jan', rating: 1847, contest: 'Div 1 + 2 Round 994' },
]

export const solvedByMonth = [
  { month: 'Feb', easy: 34, medium: 12, hard: 2 },
  { month: 'Mar', easy: 41, medium: 19, hard: 4 },
  { month: 'Apr', easy: 29, medium: 24, hard: 6 },
  { month: 'May', easy: 38, medium: 31, hard: 9 },
  { month: 'Jun', easy: 33, medium: 37, hard: 12 },
  { month: 'Jul', easy: 27, medium: 42, hard: 18 },
  { month: 'Aug', easy: 31, medium: 39, hard: 21 },
  { month: 'Sep', easy: 24, medium: 45, hard: 24 },
  { month: 'Oct', easy: 22, medium: 41, hard: 27 },
  { month: 'Nov', easy: 26, medium: 48, hard: 31 },
  { month: 'Dec', easy: 19, medium: 44, hard: 36 },
  { month: 'Jan', easy: 21, medium: 51, hard: 34 },
]

export const topicMastery = [
  { topic: 'Graphs', solved: 168, total: 220, mastery: 82 },
  { topic: 'Dynamic Programming', solved: 134, total: 240, mastery: 61 },
  { topic: 'Data Structures', solved: 121, total: 180, mastery: 74 },
  { topic: 'Number Theory', solved: 88, total: 140, mastery: 68 },
  { topic: 'Strings', solved: 72, total: 150, mastery: 54 },
  { topic: 'Greedy', solved: 96, total: 130, mastery: 79 },
  { topic: 'Geometry', solved: 31, total: 110, mastery: 29 },
  { topic: 'Flows', solved: 24, total: 90, mastery: 27 },
  { topic: 'Combinatorics', solved: 58, total: 120, mastery: 48 },
  { topic: 'Trees', solved: 103, total: 160, mastery: 71 },
]

export const platformSplit = [
  { name: 'Codeforces', value: 412, color: 'hsl(var(--chart-1))' },
  { name: 'CodeChef', value: 186, color: 'hsl(var(--chart-2))' },
  { name: 'LeetCode', value: 164, color: 'hsl(var(--chart-3))' },
  { name: 'AtCoder', value: 74, color: 'hsl(var(--chart-4))' },
  { name: 'Other', value: 26, color: 'hsl(var(--chart-5))' },
]

/** 53 weeks × 7 days of submission counts, newest week last. */
export const heatmap: { date: string; count: number }[] = (() => {
  const out: { date: string; count: number }[] = []
  const start = new Date('2025-07-28T00:00:00')
  for (let i = 0; i < 371; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const r = rand()
    // Denser in recent months to reflect the current streak.
    const recencyBoost = i > 280 ? 0.3 : 0
    const count =
      r + recencyBoost < 0.32
        ? 0
        : Math.max(1, Math.round((r + recencyBoost) * 9))
    out.push({ date: d.toISOString().slice(0, 10), count })
  }
  return out
})()

/** Weekly practice hours by weekday × time-of-day, for the activity grid. */
export const practiceGrid: { day: string; slot: string; value: number }[] = (() => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const slots = ['9am', '12pm', '3pm', '6pm', '9pm', '12am']
  const out: { day: string; slot: string; value: number }[] = []
  for (const slot of slots) {
    for (const day of days) {
      out.push({ day, slot, value: Math.round(rand() * 4) })
    }
  }
  return out
})()

export const contestPerformance = [
  { name: 'Round 981', rank: 412, solved: 4, total: 6, delta: 31 },
  { name: 'Educational 179', rank: 1204, solved: 3, total: 7, delta: -18 },
  { name: 'Round 989', rank: 218, solved: 5, total: 6, delta: 44 },
  { name: 'Starters 174', rank: 96, solved: 6, total: 8, delta: 27 },
  { name: 'ABC 402', rank: 612, solved: 5, total: 7, delta: 12 },
  { name: 'Regionals Sim #4', rank: 24, solved: 7, total: 12, delta: 58 },
  { name: 'DP Speedrun', rank: 8, solved: 5, total: 6, delta: 31 },
]

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export function difficultyVariant(d: Difficulty) {
  return d.toLowerCase() as 'easy' | 'medium' | 'hard'
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDuration(mins: number) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h ? `${h}h${m ? ` ${m}m` : ''}` : `${m}m`
}

export function compact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}
