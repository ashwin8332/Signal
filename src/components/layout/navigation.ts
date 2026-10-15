import { Bookmark, Flame, Home, Search, Settings, UserRound, type LucideIcon } from 'lucide-react';

export interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
}

export const PRIMARY_NAV: NavItem[] = [
  { href: '/dashboard', labelKey: 'nav.feed', icon: Home },
  { href: '/trending', labelKey: 'nav.trending', icon: Flame },
  { href: '/favorites', labelKey: 'nav.favorites', icon: Bookmark },
  { href: '/search', labelKey: 'nav.search', icon: Search },
];

export const SECONDARY_NAV: NavItem[] = [
  { href: '/settings', labelKey: 'nav.settings', icon: Settings },
  { href: '/profile', labelKey: 'nav.profile', icon: UserRound },
];

export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
