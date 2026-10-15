'use client';

import type { ReactNode } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import { Button } from './Button';

interface StateViewProps {
  icon: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Shared layout for empty, error and hint states: what happened, why, and
 * the next step (UI spec "States are first-class").
 */
export function StateView({ icon, title, body, action, className }: StateViewProps) {
  return (
    <div className={cn('brut mx-auto flex max-w-md flex-col items-center gap-3 bg-surface px-6 py-12 text-center', className)}>
      <span aria-hidden="true" className="brut-sm flex h-14 w-14 items-center justify-center bg-amber text-[#121210]">
        {icon}
      </span>
      <h2 className="text-xl font-black text-fg">{title}</h2>
      {body && <p className="text-sm text-fg-muted">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ title, body, onRetry, retrying }: { title: string; body: string; onRetry: () => void; retrying?: boolean }) {
  const { t } = useTranslation();
  return (
    <div role="alert">
      <StateView
        icon={<AlertTriangle className="h-6 w-6" />}
        title={title}
        body={body}
        action={
          <Button variant="secondary" icon={<RotateCw className="h-4 w-4" aria-hidden="true" />} onClick={onRetry} loading={retrying}>
            {t('common.retry')}
          </Button>
        }
      />
    </div>
  );
}

/** Inline notice for partial failures: one source down while the rest render. */
export function InlineNotice({ children, onRetry }: { children: ReactNode; onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <div role="status" className="brut-sm flex flex-wrap items-center gap-3 bg-warning-soft px-4 py-3 text-sm font-semibold text-warning-fg">
      <AlertTriangle aria-hidden="true" className="h-4 w-4 shrink-0" />
      <span className="flex-1">{children}</span>
      {onRetry && (
        <Button size="sm" variant="secondary" onClick={onRetry} icon={<RotateCw className="h-3.5 w-3.5" aria-hidden="true" />}>
          {t('common.retry')}
        </Button>
      )}
    </div>
  );
}
