'use client';

import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface TabOption<T extends string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  /** Optional count badge, e.g. results per type. */
  count?: number;
}

interface TabsProps<T extends string> {
  label: string;
  value: T;
  options: TabOption<T>[];
  onChange: (value: T) => void;
  /** id of the region these tabs filter. */
  controls?: string;
  className?: string;
}

/**
 * Segmented tabs following the WAI-ARIA tabs pattern: one tab stop, arrow
 * keys / Home / End move between tabs, and selection follows focus.
 */
export function Tabs<T extends string>({ label, value, options, onChange, controls, className }: TabsProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = options.length - 1;
    const next =
      event.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
      : event.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
      : event.key === 'Home' ? 0
      : event.key === 'End' ? last
      : null;
    if (next === null) return;
    event.preventDefault();
    refs.current[next]?.focus();
    onChange(options[next]!.value);
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn('brut-sm inline-flex max-w-full gap-1 overflow-x-auto bg-surface p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden', className)}
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={controls}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              'inline-flex min-h-9 shrink-0 items-center gap-1.5 px-3 font-mono text-xs font-bold uppercase tracking-wide transition-colors duration-150',
              selected ? 'bg-fg text-bg' : 'text-fg-muted hover:bg-surface-3 hover:text-fg',
            )}
          >
            {option.icon}
            {option.label}
            {option.count !== undefined && (
              <span
                className={cn(
                  'px-1.5 text-[11px] tabular-nums',
                  selected ? 'bg-bg text-fg' : 'bg-surface-3 text-fg',
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
