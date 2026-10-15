import type { AvatarColor } from '@/features/profile/profileSlice';
import { cn } from '@/lib/cn';

// Fixed pairs chosen for ≥ 4.5:1 contrast between initials and background in both themes.
export const AVATAR_CLASSES: Record<AvatarColor, string> = {
  indigo: 'bg-indigo-600 text-white',
  sky: 'bg-sky-700 text-white',
  emerald: 'bg-emerald-700 text-white',
  amber: 'bg-amber-700 text-white',
  rose: 'bg-rose-700 text-white',
  violet: 'bg-violet-700 text-white',
};

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return ((parts[0]![0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1]![0] ?? '') : '')).toUpperCase();
}

export function Avatar({ name, color, size = 'md' }: { name: string; color: AvatarColor; size?: 'sm' | 'md' | 'lg' }) {
  const dimensions = { sm: 'h-8 w-8 text-xs', md: 'h-9 w-9 text-sm', lg: 'h-16 w-16 text-xl' }[size];
  return (
    <span aria-hidden="true" className={cn('inline-flex shrink-0 items-center justify-center border-2 border-ink font-display font-black', dimensions, AVATAR_CLASSES[color])}>
      {initials(name)}
    </span>
  );
}
