'use client';

import { useId } from 'react';
import { cn } from '@/lib/cn';

interface SwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** On/off switch (`role="switch"`), with its label and description linked. */
export function Switch({ label, description, checked, onChange }: SwitchProps) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <label htmlFor={id} className="text-sm font-semibold text-fg">
          {label}
        </label>
        {description && (
          <p id={`${id}-desc`} className="text-sm text-fg-muted">
            {description}
          </p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? `${id}-desc` : undefined}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-7 w-12 shrink-0 items-center border-2 border-ink transition-colors duration-200',
          checked ? 'bg-primary' : 'bg-surface-3',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'inline-block h-5 w-5 border-2 border-ink transition-transform duration-200 ease-out-soft',
            checked ? 'translate-x-[20px] bg-primary-fg' : 'translate-x-0.5 bg-surface',
          )}
        />
      </button>
    </div>
  );
}
