'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUp,
  Bookmark,
  Check,
  Clapperboard,
  GripVertical,
  Keyboard,
  Languages,
  Layers,
  Lock,
  MessageCircle,
  Newspaper,
  Radio,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchSession, loginDemo } from '@/features/auth/authSlice';
import { LANGUAGES } from '@/features/preferences/preferencesSlice';
import { buttonClasses } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Logo } from '@/components/layout/Logo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { LanguageSelect } from '@/components/layout/LanguageSelect';
import { cn } from '@/lib/cn';

/** Fade-and-rise as sections scroll into view (opacity only under reduced motion). */
function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Public marketing page. It answers "what is this, why should I care, what
 * do I do next" in one scroll, and gets people into the product: sign up, or
 * one click into the live demo.
 */
export function LandingPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const status = useAppSelector((state) => state.auth.status);
  const signedIn = status === 'authenticated';
  const [demoPending, setDemoPending] = useState(false);

  useEffect(() => {
    if (status === 'idle') void dispatch(fetchSession());
  }, [status, dispatch]);

  const startDemo = async () => {
    setDemoPending(true);
    const result = await dispatch(loginDemo());
    if (loginDemo.fulfilled.match(result)) router.push('/dashboard');
    else setDemoPending(false);
  };

  const primaryCta = signedIn ? (
    <Link href="/dashboard" className={buttonClasses('primary', 'md', 'h-14 px-6 text-base')}>
      {t('landing.openDashboard')} <ArrowRight aria-hidden="true" className="h-5 w-5" />
    </Link>
  ) : (
    <Link href="/signup" className={buttonClasses('primary', 'md', 'h-14 px-6 text-base')}>
      {t('landing.ctaPrimary')} <ArrowRight aria-hidden="true" className="h-5 w-5" />
    </Link>
  );

  const demoCta = !signedIn && (
    <button type="button" onClick={() => void startDemo()} disabled={demoPending} className={buttonClasses('secondary', 'md', 'h-14 px-6 text-base')}>
      {demoPending ? <Spinner size="sm" /> : <Zap aria-hidden="true" className="h-5 w-5" />}
      {demoPending ? t('landing.ctaDemoLoading') : t('landing.ctaDemo')}
    </button>
  );

  return (
    <div className="min-h-dvh">
      {/* ── Top navigation ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b-[3px] border-ink bg-surface">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-8">
          <Link href="/" className="shrink-0">
            <Logo />
          </Link>
          <nav aria-label={t('nav.primary')} className="ml-6 hidden items-center gap-6 font-mono text-xs font-bold uppercase tracking-wider lg:flex">
            <a href="#features" className="hover:underline hover:decoration-2 hover:underline-offset-4">
              {t('landing.navFeatures')}
            </a>
            <a href="#how" className="hover:underline hover:decoration-2 hover:underline-offset-4">
              {t('landing.navHow')}
            </a>
            <a href="#built" className="hover:underline hover:decoration-2 hover:underline-offset-4">
              {t('landing.navBuilt')}
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <LanguageSelect className="hidden sm:flex" />
            {signedIn ? (
              <Link href="/dashboard" className={buttonClasses('primary', 'sm')}>
                {t('landing.openDashboard')}
              </Link>
            ) : (
              <>
                <Link href="/login" className={buttonClasses('ghost', 'sm', 'hidden sm:inline-flex')}>
                  {t('landing.signIn')}
                </Link>
                <Link href="/signup" className={buttonClasses('primary', 'sm')}>
                  {t('landing.getStarted')}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main id="main-content">
        {/* ── Hero ───────────────────────────────────────────────── */}
        <section aria-labelledby="hero-title" className="relative overflow-hidden border-b-[3px] border-ink">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 md:px-8 md:py-20 lg:grid-cols-[1.1fr_1fr] lg:py-24">
            <Reveal>
              <span className="tag bg-amber text-[#121210]">
                <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
                {t('landing.eyebrow')}
              </span>
              <h1 id="hero-title" className="mt-6 font-display text-5xl font-black uppercase leading-[0.9] tracking-tight text-fg sm:text-6xl xl:text-7xl">
                {t('landing.heroA')}
                <br />
                <span className="mt-2 inline-block -rotate-1 border-[3px] border-ink bg-accent px-3 text-[#121210] shadow-brut-lg">
                  {t('landing.heroB')}
                </span>
              </h1>
              <p className="mt-8 max-w-xl text-lg leading-relaxed text-fg-muted">{t('landing.heroBody')}</p>
              <div className="mt-8 flex flex-wrap gap-4">
                {primaryCta}
                {demoCta}
              </div>
              <p className="mt-6 font-mono text-xs font-bold uppercase tracking-wider text-fg-muted">{t('landing.trust')}</p>
            </Reveal>

            <Reveal delay={0.15}>
              <HeroPreview label={t('landing.previewLabel')} />
            </Reveal>
          </div>
        </section>

        {/* ── Marquee ────────────────────────────────────────────── */}
        <Marquee text={t('landing.marquee')} />

        {/* ── Stats ──────────────────────────────────────────────── */}
        <section aria-label={t('landing.navFeatures')} className="border-b-[3px] border-ink bg-surface">
          <dl className="mx-auto grid max-w-7xl grid-cols-2 lg:grid-cols-4">
            {[
              { value: '3', label: t('landing.statSources') },
              { value: String(LANGUAGES.length), label: t('landing.statLanguages') },
              { value: '100%', label: t('landing.statKeyboard') },
              { value: '0', label: t('landing.statTrackers') },
            ].map((stat, index) => (
              <div
                key={stat.label}
                className={cn(
                  'flex flex-col gap-1 border-ink px-6 py-8 md:px-8',
                  index % 2 === 0 && 'border-r-[3px]',
                  index < 2 && 'border-b-[3px] lg:border-b-0',
                  index === 1 && 'lg:border-r-[3px]',
                )}
              >
                <dt className="order-2 font-mono text-xs font-bold uppercase tracking-wider text-fg-muted">{stat.label}</dt>
                <dd className="order-1 font-display text-5xl font-black text-fg md:text-6xl">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ── Features ───────────────────────────────────────────── */}
        <section id="features" aria-labelledby="features-title" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 md:px-8">
          <Reveal className="max-w-2xl">
            <h2 id="features-title" className="font-display text-4xl font-black uppercase leading-none tracking-tight text-fg md:text-5xl">
              {t('landing.featuresTitle')}
            </h2>
            <p className="mt-4 text-lg text-fg-muted">{t('landing.featuresBody')}</p>
          </Reveal>
          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, index) => (
              <li key={feature.key}>
                <Reveal delay={index * 0.05} className="h-full">
                  <article className="brut press flex h-full flex-col gap-4 bg-surface p-6">
                    <div className="flex items-center justify-between">
                      <span aria-hidden="true" className={cn('brut-sm flex h-12 w-12 items-center justify-center text-[#121210]', feature.color)}>
                        <feature.icon className="h-6 w-6" />
                      </span>
                      <span aria-hidden="true" className="font-mono text-3xl font-bold text-fg/20">
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-fg">{t(`landing.${feature.key}Title`)}</h3>
                    <p className="text-sm leading-relaxed text-fg-muted">{t(`landing.${feature.key}Body`)}</p>
                  </article>
                </Reveal>
              </li>
            ))}
          </ul>
        </section>

        {/* ── How it works ───────────────────────────────────────── */}
        <section id="how" aria-labelledby="how-title" className="scroll-mt-20 border-y-[3px] border-ink bg-bar text-bar-fg">
          <div className="mx-auto max-w-7xl px-4 py-20 md:px-8">
            <Reveal>
              <h2 id="how-title" className="max-w-3xl font-display text-4xl font-black uppercase leading-none tracking-tight md:text-5xl">
                {t('landing.howTitle')}
              </h2>
            </Reveal>
            <ol className="mt-12 grid gap-6 md:grid-cols-3">
              {[1, 2, 3].map((step) => (
                <li key={step}>
                  <Reveal delay={step * 0.08} className="h-full">
                    <div className="h-full border-[3px] border-[#cfe8d6] p-6 shadow-[6px_6px_0_#cfe8d6]">
                      <span aria-hidden="true" className="font-display text-7xl font-black leading-none text-amber">
                        0{step}
                      </span>
                      <h3 className="mt-4 text-2xl font-black">{t(`landing.how${step}Title`)}</h3>
                      <p className="mt-2 text-sm leading-relaxed opacity-85">{t(`landing.how${step}Body`)}</p>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Built right ────────────────────────────────────────── */}
        <section id="built" aria-labelledby="built-title" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 md:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-start">
            <Reveal>
              <h2 id="built-title" className="font-display text-4xl font-black uppercase leading-none tracking-tight text-fg md:text-5xl">
                {t('landing.builtTitle')}
              </h2>
              <p className="mt-4 text-lg text-fg-muted">{t('landing.builtBody')}</p>
            </Reveal>
            <Reveal delay={0.1}>
              <ul className="brut-lg divide-y-2 divide-dashed divide-border bg-surface">
                {BUILT.map((item, index) => (
                  <li key={item.key} className="flex items-center gap-4 px-5 py-4">
                    <item.icon aria-hidden="true" className="h-5 w-5 shrink-0 text-fg" />
                    <span className="flex-1 font-semibold text-fg">{t(`landing.built${index + 1}`)}</span>
                    <span className="stamp text-success">
                      <Check aria-hidden="true" className="h-3 w-3" /> OK
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        {/* ── Final call to action ───────────────────────────────── */}
        <section aria-labelledby="final-title" className="border-y-[3px] border-ink bg-amber">
          <div className="mx-auto flex max-w-7xl flex-col items-start gap-8 px-4 py-20 md:px-8 lg:flex-row lg:items-center lg:justify-between">
            <Reveal>
              <h2 id="final-title" className="max-w-3xl font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-[#121210] md:text-6xl">
                {t('landing.finalTitle')}
              </h2>
              <p className="mt-4 text-lg font-semibold text-[#121210]">{t('landing.finalBody')}</p>
            </Reveal>
            <div className="flex flex-wrap gap-4">
              {primaryCta}
              {demoCta}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 md:flex-row md:items-center md:justify-between md:px-8">
          <Logo />
          <p className="max-w-2xl text-xs text-fg-muted">{t('landing.footerAttribution')}</p>
        </div>
      </footer>
    </div>
  );
}

const FEATURES: { key: string; icon: LucideIcon; color: string }[] = [
  { key: 'f1', icon: Layers, color: 'bg-[#cde6ff]' },
  { key: 'f2', icon: Sparkles, color: 'bg-[#cfe8d6]' },
  { key: 'f3', icon: GripVertical, color: 'bg-[#e8a030]' },
  { key: 'f4', icon: Search, color: 'bg-[#ecd9ff]' },
  { key: 'f5', icon: Radio, color: 'bg-[#ffe1a8]' },
  { key: 'f6', icon: Bookmark, color: 'bg-[#fbd0d0]' },
];

const BUILT: { key: string; icon: LucideIcon }[] = [
  { key: 'keys', icon: Lock },
  { key: 'sessions', icon: ShieldCheck },
  { key: 'resilience', icon: Layers },
  { key: 'a11y', icon: Keyboard },
  { key: 'i18n', icon: Languages },
  { key: 'tested', icon: Check },
];

function Marquee({ text }: { text: string }) {
  const reduce = useReducedMotion();
  const words = Array.from({ length: 8 }, () => text).join(' ');
  return (
    <div aria-hidden="true" className="overflow-hidden border-b-[3px] border-ink bg-bar py-4 text-bar-fg">
      <div className={cn('flex w-max whitespace-nowrap font-display text-3xl font-black uppercase tracking-tight md:text-4xl', !reduce && 'animate-ticker')}>
        <span className="pr-6">{words}</span>
        <span className="pr-6">{words}</span>
      </div>
    </div>
  );
}

/**
 * Decorative collage of real dashboard building blocks (tiles, cards, the
 * live pill). Hidden from assistive tech; the role="img" label describes it.
 */
function HeroPreview({ label }: { label: string }) {
  return (
    <div role="img" aria-label={label} className="relative mx-auto h-[440px] w-full max-w-lg select-none sm:h-[480px]">
      <div aria-hidden="true">
        {/* Control bar strip */}
        <div className="brut absolute left-0 right-6 top-0 flex h-10 items-center justify-between bg-bar px-3 font-mono text-[10px] font-bold uppercase tracking-wider text-bar-fg">
          <span>Signal // briefing suite</span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-accent" /> stream live
          </span>
        </div>

        {/* KPI tiles */}
        <div className="absolute left-0 top-16 grid w-[62%] grid-cols-2 gap-3">
          {[
            { n: '27', l: 'in briefing', c: 'bg-[#cde6ff]' },
            { n: '12', l: 'saved', c: 'bg-[#e8a030]' },
          ].map((tile) => (
            <div key={tile.l} className="brut bg-surface p-3">
              <span className={cn('brut-sm mb-2 block h-6 w-6', tile.c)} />
              <span className="block font-mono text-2xl font-bold text-fg">{tile.n}</span>
              <span className="font-mono text-[10px] font-bold uppercase text-fg-muted">{tile.l}</span>
            </div>
          ))}
        </div>

        {/* Spotlight news card */}
        <div className="brut absolute left-2 top-[11.5rem] w-[70%] -rotate-2 bg-surface">
          <div className="relative h-28 border-b-[3px] border-ink bg-[#cde6ff]" style={{ backgroundImage: 'repeating-linear-gradient(-45deg, rgb(18 18 16 / 0.08) 0 2px, transparent 2px 12px)' }}>
            <span className="tag absolute left-2 top-2 bg-[#cde6ff] text-[#121210]">
              <Newspaper className="h-3 w-3" /> News
            </span>
            <span className="tag absolute left-[5.5rem] top-2 bg-amber text-[#121210]">
              <Star className="h-3 w-3" fill="currentColor" /> Spotlight
            </span>
          </div>
          <div className="p-3">
            <p className="font-mono text-[10px] font-bold uppercase text-fg-muted">The Byte Report / 2h ago</p>
            <p className="mt-1 font-display text-base font-black leading-tight text-fg">How on-device AI quietly became the year’s biggest story</p>
            <span className="tag mt-2 bg-primary-soft text-primary-soft-fg">
              <Sparkles className="h-3 w-3" /> You follow Technology
            </span>
          </div>
        </div>

        {/* Film card */}
        <div className="brut absolute right-0 top-28 w-[46%] rotate-3 bg-surface">
          <div className="relative h-24 border-b-[3px] border-ink bg-[#ffe1a8]">
            <span className="tag absolute left-2 top-2 bg-[#ffe1a8] text-[#121210]">
              <Clapperboard className="h-3 w-3" /> Film
            </span>
          </div>
          <div className="p-3">
            <p className="font-display text-sm font-black leading-tight text-fg">Orbit Nine</p>
            <p className="mt-1 flex items-center gap-1 font-mono text-xs font-bold text-fg">
              <Star className="h-3 w-3" /> 8.4
            </p>
          </div>
        </div>

        {/* Social card */}
        <div className="brut absolute bottom-6 right-2 w-[52%] -rotate-1 bg-surface p-3">
          <span className="tag bg-[#ecd9ff] text-[#121210]">
            <MessageCircle className="h-3 w-3" /> Post
          </span>
          <p className="mt-2 text-xs font-semibold leading-snug text-fg">Debouncing search cut our API calls by 80% overnight.</p>
          <p className="mt-1 font-mono text-[10px] font-bold uppercase text-fg-muted">@jane_builds · 2.4K likes</p>
        </div>

        {/* Live pill */}
        <div className="brut absolute bottom-0 left-6 inline-flex h-10 items-center gap-2 bg-amber px-3 font-mono text-[11px] font-bold uppercase text-[#121210]">
          <ArrowUp className="h-3.5 w-3.5" /> 3 new posts
        </div>
      </div>
    </div>
  );
}
