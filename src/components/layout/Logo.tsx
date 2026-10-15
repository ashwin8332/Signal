import { cn } from '@/lib/cn';

/** Signal wordmark: three rising bars (a "signal" meter) + name. */
export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 font-display font-black uppercase tracking-tight', className)}>
      <span aria-hidden="true" className="flex h-9 w-9 items-end justify-center gap-[3px] border-2 border-ink bg-accent p-1.5 shadow-brut-sm">
        <span className="h-2 w-1 bg-white/70" />
        <span className="h-3.5 w-1 bg-white/85" />
        <span className="h-5 w-1 bg-white" />
      </span>
      <span className={cn('text-xl', compact && 'sr-only')}>Signal</span>
    </span>
  );
}
