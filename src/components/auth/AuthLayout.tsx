'use client';

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/layout/Logo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { LanguageSelect } from '@/components/layout/LanguageSelect';

/** Centered form card. From 1024 px a brand panel explains the product's value. */
export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const { t } = useTranslation();
  const valueProps = [t('auth.valueProps.one'), t('auth.valueProps.two'), t('auth.valueProps.three')];

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="relative hidden overflow-hidden border-r-[3px] border-ink bg-bar p-12 text-bar-fg lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-100"
          style={{
            backgroundImage:
              'linear-gradient(rgb(207 232 214 / 0.07) 1px, transparent 1px), linear-gradient(90deg, rgb(207 232 214 / 0.07) 1px, transparent 1px)',
            backgroundSize: '26px 26px',
          }}
        />
        <span className="relative">
          <Logo />
        </span>
        <div className="relative max-w-lg">
          <span className="tag mb-6 border-[#cfe8d6] bg-amber text-[#121210]">{t('dashboard.suite')}</span>
          <p className="font-display text-5xl font-black uppercase leading-[0.95] tracking-tight">{t('app.tagline')}</p>
          <ul className="mt-10 flex flex-col gap-4">
            {valueProps.map((text, index) => (
              <li key={text} className="flex items-start gap-3 text-base font-semibold">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center border-2 border-[#cfe8d6] bg-amber font-mono text-xs font-bold text-[#121210]">
                  0{index + 1}
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative font-mono text-xs font-bold uppercase tracking-widest opacity-80">© Signal · News · Films · Social</p>
      </aside>

      <div className="flex flex-col">
        <div className="flex items-center justify-between p-4 md:p-6">
          <span className="lg:invisible">
            <Logo />
          </span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSelect />
          </div>
        </div>
        <main className="flex flex-1 items-center justify-center px-4 pb-16">
          <div className="brut-lg w-full max-w-md bg-surface p-6 sm:p-8">
            <h1 className="text-3xl font-black tracking-tight text-fg">{title}</h1>
            <p className="mt-1 text-sm text-fg-muted">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
