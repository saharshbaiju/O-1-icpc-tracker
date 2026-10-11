import * as React from 'react'
import { cn } from '@/lib/utils'

/* Inputs are a white sheet with a thin border; focus turns the border black. */
const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-9 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors',
        'placeholder:text-muted-foreground',
        'focus-visible:border-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = 'Input'

export { Input }
