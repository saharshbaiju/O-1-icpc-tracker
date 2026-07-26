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
      { label: 'Contests', to: '/app/contests', icon: 'Swords' },
      { label: 'Resources', to: '/app/resources', icon: 'BookOpen' },
    ],
  },
  {
    title: 'Community',
    items: [
      { label: 'Teams', to: '/app/teams', icon: 'Users' },
      { label: 'Discussions', to: '/app/discussions', icon: 'MessagesSquare' },
      { label: 'Messages', to: '/app/messages', icon: 'Send', badge: 4 },
      { label: 'Calendar', to: '/app/calendar', icon: 'CalendarDays' },
    ],
  },
  {
    title: 'You',
    items: [
      { label: 'Profile', to: '/app/profile', icon: 'User' },
      { label: 'Achievements', to: '/app/achievements', icon: 'Medal' },
      { label: 'Settings', to: '/app/settings', icon: 'Settings' },
      {
        label: 'Admin Panel',
        to: '/app/admin',
        icon: 'ShieldCheck',
        roles: ['admin'],
      },
    ],
  },
]

export function visibleSections(role: Role): NavSection[] {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((i) => !i.roles || i.roles.includes(role)),
  })).filter((s) => s.items.length > 0)
}
