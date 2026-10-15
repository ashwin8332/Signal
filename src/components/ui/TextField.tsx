'use client';

import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from 'react';
import { cn } from '@/lib/cn';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  /** Visually hide the label (it stays available to screen readers). */
  hideLabel?: boolean;
  hint?: ReactNode;
  error?: string | null;
  trailing?: ReactNode;
  leading?: ReactNode;
  ref?: Ref<HTMLInputElement>;
  containerClassName?: string;
}

/** Labelled input with hint and error wired up through aria-describedby. */
export function TextField({
  label,
  hideLabel = false,
  hint,
  error,
  trailing,
  leading,
  className,
  containerClassName,
  ref,
  ...props
}: TextFieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      <label htmlFor={id} className={cn('font-mono text-xs font-bold uppercase tracking-wider text-fg', hideLabel && 'sr-only')}>
        {label}
      </label>
      <div className="relative flex items-center">
        {leading && <span className="pointer-events-none absolute left-3 flex text-fg-muted">{leading}</span>}
        <input
          id={id}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
          className={cn(
            'h-11 w-full rounded-control border-2 bg-surface px-3 text-base text-fg placeholder:text-fg-muted transition-shadow duration-150 sm:text-sm',
            'focus-visible:shadow-brut-sm focus-visible:outline-none',
            error ? 'border-danger' : 'border-ink',
            leading ? 'pl-10' : null,
            trailing ? 'pr-11' : null,
            className,
          )}
          {...props}
        />
        {trailing && <span className="absolute right-1 flex">{trailing}</span>}
      </div>
      {error && (
        <p id={errorId} className="text-sm font-semibold text-danger">
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className="text-sm text-fg-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
