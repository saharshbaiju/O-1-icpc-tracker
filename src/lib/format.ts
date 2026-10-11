const DAY = 864e5

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 6e4)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

/** Whole days from today to a YYYY-MM-DD deadline (negative = overdue). */
export function daysLeft(date: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((new Date(date + 'T00:00:00').getTime() - today.getTime()) / DAY)
}

export function deadlineLabel(date: string | null) {
  if (!date) return 'No deadline'
  const d = daysLeft(date)
  if (d < 0) return `${-d}d overdue`
  if (d === 0) return 'Due today'
  if (d === 1) return 'Due tomorrow'
  return `${d} days left`
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')
}

export const VERDICT_SHORT: Record<string, string> = {
  OK: 'Accepted',
  WRONG_ANSWER: 'Wrong answer',
  TIME_LIMIT_EXCEEDED: 'Time limit',
  RUNTIME_ERROR: 'Runtime error',
  MEMORY_LIMIT_EXCEEDED: 'Memory limit',
  COMPILATION_ERROR: 'Compile error',
}
