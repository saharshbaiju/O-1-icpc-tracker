import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/* Paper buttons: black pill by default, thin-bordered white sheet for outline, bare for ghost. No shadows. */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-[hsl(0_0%_20%)]',
        contrast: 'bg-foreground text-background hover:bg-[hsl(0_0%_20%)]',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-[hsl(0_0%_20%)]',
        outline: 'border border-border bg-card text-foreground hover:bg-secondary',
        secondary: 'bg-secondary text-foreground hover:bg-accent',
        ghost: 'bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground',
        link: 'text-foreground underline underline-offset-4 hover:text-muted-foreground',
        glass: 'border border-border bg-card text-foreground hover:bg-secondary',
      },
      size: {
        default: 'h-9 px-4 py-2 text-xs',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-11 px-6 text-sm',
        icon: 'h-9 w-9 rounded-lg',
        'icon-sm': 'h-8 w-8 rounded-lg',
        pill: 'h-9 px-5 text-xs',
        none: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
