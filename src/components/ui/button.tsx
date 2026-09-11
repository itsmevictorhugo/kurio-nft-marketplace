import type { ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md font-display text-xs font-bold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kurio-accent focus-visible:ring-offset-2 focus-visible:ring-offset-kurio-night disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-kurio-flame text-kurio-night hover:bg-kurio-accent',
        outline: 'border border-kurio-line bg-transparent text-kurio-cream hover:bg-kurio-raised',
        ghost: 'bg-transparent text-kurio-tan hover:bg-kurio-raised hover:text-kurio-cream',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 px-3',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
