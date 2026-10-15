import { cn } from '@/lib/cn';

/** Decorative spinner; pair it with visible or screen-reader text describing the wait. */
export function Spinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const dimensions = { sm: 'h-4 w-4 border-2', md: 'h-5 w-5 border-2', lg: 'h-8 w-8 border-[3px]' }[size];
  return (
    <span
      aria-hidden="true"
      className={cn('inline-block animate-spin-slow rounded-full border-current border-r-transparent', dimensions, className)}
    />
  );
}
