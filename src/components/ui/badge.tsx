import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/* Monochrome chips: black fill, grey fill, or a thin outlined chip. Never colour. */
const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-4 whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'border-primary bg-primary text-primary-foreground',
        secondary: 'border-border bg-transparent text-foreground',
        outline: 'border-border bg-transparent text-foreground',
        success: 'border-primary bg-primary text-primary-foreground',
        warning: 'border-border bg-secondary text-foreground',
        destructive: 'border-foreground bg-transparent text-foreground',
        lime: 'border-primary bg-primary text-primary-foreground',
        easy: 'border-border bg-transparent text-muted-foreground',
        medium: 'border-border bg-secondary text-foreground',
        hard: 'border-primary bg-primary text-primary-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
