import type { Role } from '@/lib/data'

export interface NavItem {
  label: string
  to: string
  icon: string
  roles?: Role[]
  badge?: number
}

export interface NavSection {
  title: string
  items: NavItem[]
}

/** Icon names map to lucide-react exports; resolved in the sidebar. */
export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', to: '/app', icon: 'LayoutDashboard' },
      { label: 'Analytics', to: '/app/analytics', icon: 'ChartSpline' },
      { label: 'Leaderboard', to: '/app/leaderboard', icon: 'Trophy' },
    ],
  },
  {
    title: 'Practice',
    items: [
      { label: 'Problems', to: '/app/problems', icon: 'ListTodo' },
      { label: 'Practice Sheets', to: '/app/sheets', icon: 'ClipboardList' },
      { label: 'Resources', to: '/app/resources', icon: 'BookOpen' },
    ],
  },
  {
    title: 'Team',
    items: [
      { label: 'Teams', to: '/app/teams', icon: 'Users' },
      { label: 'Calendar', to: '/app/calendar', icon: 'CalendarDays' },
    ],
  },
  {
    title: 'You',
    items: [{ label: 'Settings', to: '/app/settings', icon: 'Settings' }],
  },
]

export function visibleSections(role: Role): NavSection[] {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((i) => !i.roles || i.roles.includes(role)),
  })).filter((s) => s.items.length > 0)
}
