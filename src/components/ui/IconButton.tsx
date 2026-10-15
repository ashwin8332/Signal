'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  /** Required accessible name; also shown as a tooltip on hover and focus. */
  label: string;
  icon: ReactNode;
  tooltip?: boolean;
  tooltipSide?: 'top' | 'bottom' | 'right';
  size?: 'sm' | 'md';
}

const TOOLTIP_POSITION = {
  top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
  bottom: 'top-full left-1/2 mt-2 -translate-x-1/2',
  right: 'left-full top-1/2 ml-2 -translate-y-1/2',
};

export function IconButton({
  label,
  icon,
  tooltip = true,
  tooltipSide = 'bottom',
  size = 'md',
  className,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(
        'group/icon relative inline-flex shrink-0 items-center justify-center rounded-control text-fg-muted transition-colors duration-150',
        'hover:bg-surface-3 hover:text-fg disabled:pointer-events-none disabled:opacity-40',
        // 44 px on touch; 36 px is fine for precise pointers (WCAG 2.5.8 min 24 px).
        size === 'md' ? 'h-11 w-11 pointer-fine:h-9 pointer-fine:w-9' : 'h-9 w-9 pointer-fine:h-8 pointer-fine:w-8',
        className,
      )}
      {...props}
    >
      {icon}
      {tooltip && (
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute z-50 whitespace-nowrap border-2 border-ink bg-fg px-2 py-1 font-mono text-[11px] font-bold text-bg opacity-0 transition-opacity duration-150',
            'group-hover/icon:opacity-100 group-focus-visible/icon:opacity-100 pointer-coarse:hidden',
            TOOLTIP_POSITION[tooltipSide],
          )}
        >
          {label}
        </span>
      )}
    </button>
  );
}
