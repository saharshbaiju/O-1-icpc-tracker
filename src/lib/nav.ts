export interface NavItem {
  label: string
  to: string
  icon: string
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
      { label: 'Leaderboard', to: '/app/leaderboard', icon: 'Trophy' },
    ],
  },
  {
    title: 'Practice',
    items: [
      { label: 'Problems', to: '/app/problems', icon: 'ListTodo' },
      { label: 'Submissions', to: '/app/submissions', icon: 'History' },
      { label: 'Sheets', to: '/app/sheets', icon: 'ClipboardList' },
    ],
  },
  {
    title: 'Team',
    items: [{ label: 'My team', to: '/app/team', icon: 'Users' }],
  },
  {
    title: 'Project',
    items: [{ label: 'Database', to: '/app/database', icon: 'Database' }],
  },
]
