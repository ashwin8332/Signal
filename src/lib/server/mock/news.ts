import type { ContentItem } from '@/types/content';
import type { NewsCategory } from '@/lib/constants';
import { between, createRandom, mockImage, mockNow, pick, slugify } from './random';

/** Items each mock category can produce before reporting `hasMore: false`. */
export const MOCK_NEWS_PER_CATEGORY = 63;

interface CategoryCorpus {
  outlets: string[];
  subjects: string[];
  headlines: string[];
  summaries: string[];
}

// `{s}` is replaced with a subject. Kept plain and neutral: this is demo copy.
const CORPUS: Record<NewsCategory, CategoryCorpus> = {
  technology: {
    outlets: ['The Byte Report', 'Circuit Daily', 'Stack Weekly', 'Open Source Times'],
    subjects: [
      'on-device AI assistants',
      'quantum error correction',
      'open-source browsers',
      'solid-state batteries',
      'satellite internet',
      'passkeys',
      'chip design',
      'robotics startups',
      'WebAssembly',
      'edge computing',
    ],
    headlines: [
      "The quiet engineering behind {s}",
      "{S} goes mainstream: what changes for everyday users",
      "Startups and giants clash over {s}",
      "Open questions about {s} that experts still argue over",
      'How {s} quietly became the year’s biggest story',
      'Five things developers should know about {s}',
      'Inside the race to scale {s}',
      'Why investors are betting big on {s}',
      'A practical guide to {s} for small teams',
      'Regulators take a closer look at {s}',
      'The surprising energy cost of {s}',
      'What {s} means for your privacy',
    ],
    summaries: [
      'Engineers say the shift around {s} is moving faster than expected, with early adopters reporting real gains and a few hard lessons.',
      'We spoke with researchers and product leads about where {s} goes next, and the trade-offs nobody is talking about yet.',
      'A look at the benchmarks, the hype and the practical questions teams should ask before adopting {s}.',
    ],
  },
  business: {
    outlets: ['Market Ledger', 'The Balance Sheet', 'Capital Brief', 'Finance Hour'],
    subjects: [
      'interest rates',
      'small-business lending',
      'the housing market',
      'renewable energy funds',
      'retail earnings',
      'supply chains',
      'remote-work policies',
      'index funds',
      'the startup funding market',
      'consumer spending',
    ],
    headlines: [
      "Small firms adapt as {s} reshapes margins",
      "{S}: winners, losers and what comes next",
      "Why economists are watching {s} closely",
      'What the latest data says about {s}',
      'Analysts split on the outlook for {s}',
      '{S} shows signs of a turnaround',
      'Three charts that explain {s} right now',
      'How {s} could affect your budget this quarter',
      'Companies rethink strategy as {s} shifts',
      'The quiet trend reshaping {s}',
    ],
    summaries: [
      'Economists point to mixed signals around {s}; here is what the numbers show and what to watch next.',
      'Executives describe how changes in {s} are filtering into hiring, pricing and long-term planning.',
      'A plain-language explainer on {s}, why it moved this week, and who feels it first.',
    ],
  },
  sports: {
    outlets: ['Full Time', 'The Sideline', 'Matchday Wire', 'Pitch & Court'],
    subjects: [
      'the title race',
      'the transfer window',
      'women’s football',
      'the marathon season',
      'the cricket World Cup',
      'grand slam tennis',
      'the basketball playoffs',
      'Formula 1 strategy',
      'youth academies',
      'sports science',
    ],
    headlines: [
      "{S}: the numbers behind the headlines",
      "Fans react as {s} delivers another twist",
      "Inside the training camps preparing for {s}",
      '{S}: winners and losers from the weekend',
      'Tactical breakdown: what decided {s}',
      'Five storylines to follow in {s}',
      'Rising stars set to define {s}',
      'Data shows a new pattern in {s}',
      'Coaches weigh in on {s}',
    ],
    summaries: [
      'Momentum swung twice in {s} this week. We break down the key moments, the numbers and what comes next.',
      'From late drama to breakout performances, a quick catch-up on {s} and the stories behind the results.',
      'Players and analysts explain how preparation and data are changing {s}.',
    ],
  },
  science: {
    outlets: ['Lab Notes', 'Orbit Science', 'The Field Journal', 'Discovery Desk'],
    subjects: [
      'deep-sea ecosystems',
      'the James Webb telescope',
      'gene editing',
      'climate models',
      'exoplanet atmospheres',
      'ancient DNA',
      'fusion experiments',
      'coral reef recovery',
      'Mars sample return',
      'bird migration',
    ],
    headlines: [
      "{S}: a field guide for the curious",
      "The surprising history of {s}",
      "New instruments open a window on {s}",
      'New findings shed light on {s}',
      'Scientists rethink assumptions about {s}',
      'What we learned this year about {s}',
      'A closer look at {s}, explained',
      'Researchers report a milestone in {s}',
      'Why {s} matters more than you think',
    ],
    summaries: [
      'A new peer-reviewed study on {s} challenges an older model and opens fresh questions for the field.',
      'Researchers walk through what the data on {s} does and does not tell us, and what comes next.',
      'An accessible explainer on {s}, with the key figures and the open debates.',
    ],
  },
  health: {
    outlets: ['Well Daily', 'Health Matters', 'The Clinic Brief', 'Pulse Review'],
    subjects: [
      'sleep quality',
      'strength training',
      'gut health',
      'screen time',
      'heart health',
      'mental wellbeing at work',
      'nutrition labels',
      'walking habits',
      'seasonal allergies',
      'hydration',
    ],
    headlines: [
      "A week-long experiment with {s}",
      "{S} and sleep: what's the connection?",
      "Five questions to ask your doctor about {s}",
      'Experts share simple ways to improve {s}',
      'What the research really says about {s}',
      '{S}: myths, facts and practical tips',
      'Small changes that make a difference to {s}',
      'Doctors answer common questions about {s}',
    ],
    summaries: [
      'Clinicians summarize the evidence on {s} and the small, sustainable habits that make the biggest difference.',
      'A balanced look at {s}, separating headline claims from what studies actually support.',
      'Practical, evidence-based guidance on {s}, and when it is worth talking to a professional.',
    ],
  },
  entertainment: {
    outlets: ['Screen & Stage', 'Culture Feed', 'The Premiere', 'Headliner'],
    subjects: [
      'festival season',
      'streaming originals',
      'indie games',
      'the box office',
      'award-season contenders',
      'live music tours',
      'animated features',
      'book adaptations',
      'podcast charts',
      'stand-up comedy',
    ],
    headlines: [
      "Hidden gems from {s} you might have missed",
      "{S}: the definitive ranking",
      "Inside the writers' room shaping {s}",
      'The biggest surprises of {s} so far',
      'Critics pick the standouts of {s}',
      'Behind the scenes of {s}',
      'Everything to know about {s} this month',
      'How {s} is changing the industry',
    ],
    summaries: [
      'From breakout hits to quiet gems, a roundup of {s} and the releases people keep recommending.',
      'Creators and critics discuss what is working in {s} and what audiences want next.',
      'A quick guide to {s}: dates, highlights and the conversations worth following.',
    ],
  },
  general: {
    outlets: ['Morning Edition', 'The Daily Signal', 'Global Desk', 'City Report'],
    subjects: [
      'public transport',
      'city parks',
      'local elections',
      'school schedules',
      'community libraries',
      'cycling infrastructure',
      'heatwave preparedness',
      'volunteering',
      'museum exhibitions',
      'food markets',
    ],
    headlines: [
      "{S}: a timeline of recent changes",
      "Volunteers step up to support {s}",
      "How neighbouring cities handle {s}",
      'What changes this month for {s}',
      'Residents weigh in on {s}',
      'A guide to {s} in your area',
      'The story behind the debate over {s}',
      'Five facts about {s}',
    ],
    summaries: [
      'Officials and residents explain what is changing with {s} and how it affects daily routines.',
      'A clear rundown of {s}: the timeline, the trade-offs and where to find more information.',
      'Local voices share their view on {s} and what they hope happens next.',
    ],
  },
};

function fill(template: string, subject: string): string {
  return template
    .replace('{S}', subject.charAt(0).toUpperCase() + subject.slice(1))
    .replaceAll('{s}', subject);
}

/** The `index`-th mock article of a category (0-based, deterministic). */
export function mockArticle(category: NewsCategory, index: number): ContentItem {
  const corpus = CORPUS[category];
  const random = createRandom(`news:${category}:${index}`);
  const subject = corpus.subjects[index % corpus.subjects.length] as string;
  const title = fill(pick(random, corpus.headlines), subject);
  const id = `news:${category}-${index}`;
  return {
    id,
    type: 'news',
    title,
    summary: fill(pick(random, corpus.summaries), subject),
    imageUrl: mockImage(id),
    url: `https://news.google.com/search?q=${encodeURIComponent(subject)}`,
    source: pick(random, corpus.outlets),
    author: pick(random, ['Alex Morgan', 'Priya Nair', 'Sam Okafor', 'Lena Fischer', 'Diego Ruiz', 'Mei Tanaka']),
    // Spread articles over the past days: newer index → more recent.
    publishedAt: new Date(mockNow() - (index * 47 + between(random, 0, 40)) * 60_000).toISOString(),
    category,
    tags: [category, slugify(subject)],
    reason: `category:${category}`,
    metrics: { label: 'reads', value: between(random, 800, 98_000) },
  };
}

/**
 * Page of mock news across several categories. Item k of the combined stream
 * comes from category k mod n, so pages never overlap and every category is
 * represented evenly.
 */
export function mockNewsPage(categories: NewsCategory[], page: number, pageSize: number) {
  const total = categories.length * MOCK_NEWS_PER_CATEGORY;
  const start = (page - 1) * pageSize;
  const items: ContentItem[] = [];
  for (let k = start; k < Math.min(start + pageSize, total); k += 1) {
    const category = categories[k % categories.length] as NewsCategory;
    items.push(mockArticle(category, Math.floor(k / categories.length)));
  }
  return { items, hasMore: start + pageSize < total };
}

export function mockNewsCorpus(categories: readonly NewsCategory[], perCategory: number): ContentItem[] {
  return categories.flatMap((category) =>
    Array.from({ length: perCategory }, (_, index) => mockArticle(category, index)),
  );
}
