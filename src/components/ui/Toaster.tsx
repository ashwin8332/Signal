'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { dismissToast, type Toast } from '@/features/ui/uiSlice';
import { cn } from '@/lib/cn';

const TOAST_MS = 5000;

const ICONS = {
  info: <Info aria-hidden="true" className="h-4 w-4 text-primary" />,
  success: <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-success" />,
  error: <XCircle aria-hidden="true" className="h-4 w-4 text-danger" />,
};

function ToastItem({ toast }: { toast: Toast }) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [paused, setPaused] = useState(false);
  const remaining = useRef(TOAST_MS);

  // Auto-dismiss after 5 s; pauses while hovered or focused (WCAG 2.2.1).
  useEffect(() => {
    if (paused) return;
    const started = Date.now();
    const timer = setTimeout(() => dispatch(dismissToast(toast.id)), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - started;
    };
  }, [paused, dispatch, toast.id]);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, transition: { duration: 0.15 } }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="brut pointer-events-auto flex w-full items-center gap-3 bg-surface px-4 py-3 text-sm font-semibold text-fg"
    >
      {ICONS[toast.tone]}
      <span className="flex-1">{t(toast.message, toast.values)}</span>
      {toast.action && (
        <button
          type="button"
          className="border-2 border-ink bg-amber px-2 py-1 font-mono text-xs font-bold uppercase text-[#121210] hover:brightness-95"
          onClick={() => {
            dispatch(toast.action!.dispatch);
            dispatch(dismissToast(toast.id));
          }}
        >
          {t(toast.action.label)}
        </button>
      )}
      <button
        type="button"
        aria-label={t('common.dismiss')}
        className="rounded-md p-1 text-fg-muted hover:bg-surface-2 hover:text-fg"
        onClick={() => dispatch(dismissToast(toast.id))}
      >
        <X aria-hidden="true" className="h-4 w-4" />
      </button>
    </motion.li>
  );
}

/** Live region announcing toasts politely to screen readers. */
export function Toaster() {
  const toasts = useAppSelector((state) => state.ui.toasts);
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center p-4 sm:justify-end sm:p-6')}
    >
      <ul className="flex w-full max-w-sm flex-col gap-2">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} />
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
