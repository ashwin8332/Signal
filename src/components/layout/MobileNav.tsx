'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setMobileNavOpen } from '@/features/ui/uiSlice';
import { IconButton } from '@/components/ui/IconButton';
import { Logo } from './Logo';
import { NavLinks } from './NavLinks';
import { PRIMARY_NAV, SECONDARY_NAV } from './navigation';

/**
 * Off-canvas navigation below 768 px, built on the native modal <dialog>,
 * which gives us a focus trap, Esc to close, an inert background and focus
 * restoration to the menu button for free.
 */
export function MobileNav() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const open = useAppSelector((state) => state.ui.mobileNavOpen);
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Close after navigating.
  useEffect(() => {
    dispatch(setMobileNavOpen(false));
  }, [pathname, dispatch]);

  const close = () => dispatch(setMobileNavOpen(false));

  return (
    <dialog
      ref={dialogRef}
      aria-label={t('nav.primary')}
      onClose={close}
      onClick={(event) => {
        // Click on the backdrop (outside the panel) closes.
        if (event.target === dialogRef.current) close();
      }}
      className="m-0 h-dvh max-h-dvh w-[min(20rem,85vw)] max-w-none border-r-[3px] border-ink bg-surface p-0 text-fg backdrop:bg-black/60 md:hidden"
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-between border-b-[3px] border-ink bg-bar px-4 text-bar-fg">
          <Logo />
          <IconButton label={t('nav.closeMenu')} icon={<X className="h-5 w-5" />} onClick={close} tooltip={false} className="text-bar-fg hover:bg-white/10 hover:text-bar-fg" />
        </div>
        <nav aria-label={t('nav.primary')} className="flex flex-1 flex-col justify-between gap-6 overflow-y-auto p-3">
          <NavLinks items={PRIMARY_NAV} variant="full" onNavigate={close} />
          <div className="border-t-2 border-dashed border-border pt-4">
            <NavLinks items={SECONDARY_NAV} variant="full" onNavigate={close} />
          </div>
        </nav>
      </div>
    </dialog>
  );
}
