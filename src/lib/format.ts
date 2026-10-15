const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: 'second' },
  { amount: 60, unit: 'minute' },
  { amount: 24, unit: 'hour' },
  { amount: 7, unit: 'day' },
  { amount: 4.34524, unit: 'week' },
  { amount: 12, unit: 'month' },
  { amount: Number.POSITIVE_INFINITY, unit: 'year' },
];

/** "3 hours ago" / "hace 3 horas" in the reader's language. */
export function formatRelativeTime(iso: string, locale: string, now = Date.now()): string {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return '';
  let duration = (time - now) / 1000;
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) return formatter.format(Math.round(duration), division.unit);
    duration /= division.amount;
  }
  return '';
}

/** 12_400 → "12K" (en) / "12 k" (fr). */
export function formatCompactNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

export function formatDate(iso: string, locale: string): string {
  const time = Date.parse(iso);
  return Number.isNaN(time) ? '' : new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(time);
}
