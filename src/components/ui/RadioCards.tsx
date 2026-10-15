'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface RadioCardsProps<T extends string> {
  legend: string;
  name: string;
  value: T;
  options: { value: T; label: string; icon?: ReactNode }[];
  onChange: (value: T) => void;
}

/** Segmented single choice built on native radio inputs (arrow keys, form semantics for free). */
export function RadioCards<T extends string>({ legend, name, value, options, onChange }: RadioCardsProps<T>) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-fg">{legend}</legend>
      <div className="grid grid-cols-3 gap-2 sm:inline-grid sm:w-auto">
        {options.map((option) => (
          <label key={option.value} className="relative cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span
              className={cn(
                'flex h-11 items-center justify-center gap-2 border-2 border-ink px-4 font-mono text-xs font-bold uppercase transition-colors duration-150',
                'bg-surface text-fg hover:bg-surface-3',
                'peer-checked:bg-fg peer-checked:text-bg peer-checked:shadow-brut-sm',
                'peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus',
              )}
            >
              {option.icon}
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
