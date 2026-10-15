'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected: boolean;
  children: ReactNode;
}

/**
 * Toggle chip. State is announced via aria-pressed and shown with a check
 * icon plus fill, never color alone.
 */
export function Chip({ selected, children, className, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        'inline-flex min-h-9 items-center gap-1.5 border-2 border-ink px-3 py-1.5 text-sm font-semibold transition-[background-color,box-shadow,transform] duration-150',
        'aria-disabled:cursor-not-allowed aria-disabled:opacity-60',
        selected ? 'bg-fg text-bg shadow-brut-sm' : 'bg-surface text-fg hover:-translate-y-px hover:bg-surface-3',
        className,
      )}
      {...props}
    >
      {selected && <Check aria-hidden="true" className="h-4 w-4" />}
      {children}
    </button>
  );
}
