import { useState } from 'react'
import { Plus } from 'lucide-react'

import { useApi, type UniversityMatch } from '@/lib/api'
import { useDebounced } from '@/lib/useDebounced'
import { cn } from '@/lib/utils'

/**
 * College field for sign-up. As you type it asks the backend for similar
 * names (pg_trgm similarity, so typos still match) and offers them first,
 * which keeps "Amrita" and "Amritha" from becoming two colleges. If nothing
 * fits, the name you typed is added as a new college.
 */
export function CollegeInput({
  value,
  onChange,
  onIsNewChange,
}: {
  value: string
  onChange: (name: string) => void
  onIsNewChange: (isNew: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const query = useDebounced(value.trim(), 200)
  const state = useApi<UniversityMatch[]>(query ? `/universities/search?q=${encodeURIComponent(query)}` : null)
  const matches = query ? state.data ?? [] : []

  const exact = matches.find((m) => m.univ_name.toLowerCase() === value.trim().toLowerCase())
  // Until the debounced search catches up with the typing, the matches are stale.
  const searching = state.loading || query !== value.trim()
  const isNew = value.trim() !== '' && !exact && !searching
  // Options: the matches, then "add as new" when nothing matches exactly.
  const optionCount = matches.length + (isNew ? 1 : 0)

  function pick(name: string) {
    onChange(name)
    onIsNewChange(false)
    setOpen(false)
  }

  function addNew() {
    onIsNewChange(true)
    setOpen(false)
  }

  return (
    <div className="relative">
      <input
        role="combobox"
        aria-expanded={open && optionCount > 0}
        aria-controls="college-options"
        aria-autocomplete="list"
        aria-activedescendant={open && optionCount > 0 ? `college-option-${active}` : undefined}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          onIsNewChange(false)
          setOpen(true)
          setActive(0)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (!open || optionCount === 0) return
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActive((i) => (i + 1) % optionCount)
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActive((i) => (i - 1 + optionCount) % optionCount)
          } else if (e.key === 'Enter') {
            e.preventDefault()
            if (active < matches.length) pick(matches[active].univ_name)
            else if (isNew) addNew()
          } else if (e.key === 'Escape') {
            setOpen(false)
          }
        }}
        placeholder="College / university"
        aria-label="College or university"
        className="paper-input rounded-full text-xs"
        autoComplete="off"
      />

      {open && optionCount > 0 && (
        <ul
          id="college-options"
          role="listbox"
          className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-2xl border border-border bg-card py-1 text-xs shadow-lg"
        >
          {matches.length > 0 && !exact && (
            <li className="px-4 pb-1 pt-2 text-[10px] uppercase tracking-wide text-muted-foreground">Did you mean</li>
          )}
          {matches.map((m, i) => (
            <li
              key={m.univ_id}
              id={`college-option-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(m.univ_name)}
              onMouseEnter={() => setActive(i)}
              className={cn('flex cursor-pointer items-baseline justify-between gap-3 px-4 py-2', i === active && 'bg-secondary')}
            >
              <span className="truncate">{m.univ_name}</span>
              <span className="shrink-0 text-[10px] text-muted-foreground">{m.city}</span>
            </li>
          ))}
          {isNew && (
            <li
              id={`college-option-${matches.length}`}
              role="option"
              aria-selected={active === matches.length}
              onMouseDown={(e) => e.preventDefault()}
              onClick={addNew}
              onMouseEnter={() => setActive(matches.length)}
              className={cn(
                'flex cursor-pointer items-center gap-2 px-4 py-2',
                matches.length > 0 && 'border-t border-border',
                active === matches.length && 'bg-secondary'
              )}
            >
              <Plus className="h-3.5 w-3.5 shrink-0" />
              <span className="min-w-0 truncate">Add “{value.trim()}” as a new college</span>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
