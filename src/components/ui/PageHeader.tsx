import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: ReactNode;
  /** id for aria-labelledby on the surrounding section. */
  titleId?: string;
  /** Small line above the title (e.g. a greeting); not part of the heading. */
  eyebrow?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

/** Every dashboard screen starts with an h1 and one line on what it's for ("Where am I?"). */
export function PageHeader({ title, titleId, eyebrow, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="flex min-w-0 flex-col gap-1">
        {eyebrow && <p className="font-mono text-xs font-bold uppercase tracking-widest text-fg-muted">{eyebrow}</p>}
        <h1 id={titleId} className="text-3xl font-black tracking-tight text-fg md:text-4xl">
          {title}
        </h1>
        {description && <p className="max-w-[70ch] text-sm text-fg-muted md:text-base">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
