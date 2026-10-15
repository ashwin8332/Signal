'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/lib/cn';
import { isActive, type NavItem } from './navigation';

interface NavLinksProps {
  items: NavItem[];
  /** "rail" hides labels visually (tablet icon rail); they stay as tooltips and accessible names. */
  variant: 'full' | 'rail';
  onNavigate?: () => void;
}

export function NavLinks({ items, variant, onNavigate }: NavLinksProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const favoriteCount = useAppSelector((state) => state.favorites.ids.length);

  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        const label = t(item.labelKey);
        const badge = item.href === '/favorites' && favoriteCount > 0 ? favoriteCount : null;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? 'page' : undefined}
              onClick={onNavigate}
              className={cn(
                'group/nav relative flex h-11 items-center gap-3 border-2 text-sm font-bold transition-[background-color,box-shadow,transform] duration-150',
                variant === 'rail' ? 'justify-center px-0' : 'px-3',
                active ? 'border-ink bg-fg text-bg shadow-brut-sm' : 'border-transparent text-fg hover:border-ink hover:bg-surface-3',
              )}
            >
              {/* Active state = inverted fill + offset shadow + bold, never color alone. */}
              <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
              <span className={cn(variant === 'rail' && 'sr-only', active && 'font-black')}>{label}</span>
              {badge !== null && (
                <span
                  className={cn(
                    'border-2 border-ink bg-amber px-1.5 font-mono text-[11px] font-bold tabular-nums text-[#121210]',
                    variant === 'rail' ? 'absolute -right-1 -top-1' : 'ml-auto',
                  )}
                >
                  {badge}
                </span>
              )}
              {variant === 'rail' && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap border-2 border-ink bg-fg px-2 py-1 font-mono text-[11px] font-bold text-bg opacity-0 transition-opacity group-hover/nav:opacity-100 group-focus-visible/nav:opacity-100"
                >
                  {label}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
