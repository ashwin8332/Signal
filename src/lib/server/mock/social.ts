import type { ContentItem } from '@/types/content';
import { between, createRandom, mockImage, mockNow, pick } from './random';

/** Posts each mock hashtag can produce before `hasMore: false`. */
export const MOCK_POSTS_PER_HASHTAG = 60;

const AUTHORS = [
  { name: 'Grace Mensah', handle: 'grace_ships' },
  { name: 'Omar Haddad', handle: 'omar_h' },
  { name: 'Sofia Rossi', handle: 'sofia_ux' },
  { name: 'Wei Zhang', handle: 'weizhang_dev' },
  { name: 'Jane Cho', handle: 'jane_builds' },
  { name: 'Marcus Lee', handle: 'marcus_codes' },
  { name: 'Aisha Bello', handle: 'aisha_data' },
  { name: 'Tom Becker', handle: 'tombecker' },
  { name: 'Lucía Romero', handle: 'lucia_rm' },
  { name: 'Kenji Watanabe', handle: 'kenji_w' },
  { name: 'Nora Lindqvist', handle: 'nora_writes' },
  { name: 'Ravi Kapoor', handle: 'ravi_k' },
];

// Posts for well-known hashtags. Unknown hashtags fall back to GENERIC.
const POSTS: Record<string, string[]> = {
  ai: [
    "Benchmarks are a map, not the territory. Ran our model on real support tickets: very different ranking.",
    "Our retrieval pipeline got 30% better by fixing chunking, not by changing models.",
    "Pairing a tiny model with good guardrails beat the big model on cost and accuracy for our use case.",
    'Shipped our first feature that runs a small model fully on-device. Latency went from 900ms to 60ms. Worth it.',
    'Hot take: the best AI feature is the one users never notice. It just removes a step.',
    'Spent the afternoon writing evals before prompts. Should have done that months ago.',
    'Reminder that "the model said so" is not a test strategy. Measure it.',
  ],
  webdev: [
    "Moved our images to AVIF with a proper fallback. LCP dropped by a full second on mobile.",
    "Hot tip: test your app with the keyboard only for ten minutes. You will find bugs.",
    "View transitions in the browser make page changes feel native. Shipping it behind a flag.",
    'Replaced 400 lines of client state with a single server component. Bundle down 38%.',
    'Accessibility pass on our dashboard found 23 issues. 19 were missing labels. Label your inputs, friends.',
    'CSS container queries finally let our cards adapt to where they live, not the window. Love it.',
    'Debouncing search cut our API calls by 80% overnight. Simple wins are still wins.',
  ],
  football: [
    "Youth academy graduate scored on debut tonight. The stadium went absolutely silent, then erupted.",
    "xG says we deserved the draw. My heart says we deserved the win.",
    "Set-piece coaching is the most underrated hire in modern football.",
    'That last-minute equalizer had the whole stadium shaking. What a match.',
    'Our academy just promoted three players to the first team. The future looks bright.',
    'Pressing stats this season are wild. The high line is back and it is working.',
    'Unpopular opinion: the midfield battle decided that game, not the goals.',
  ],
  markets: [
    "Bond yields moved more this week than in the last three months combined. Buckle up.",
    "Earnings season tip: read the guidance, not the headline number.",
    "Dollar-cost averaging is boring, and boring is how most people win.",
    'Quiet week in the markets, which usually means something loud is coming.',
    'Rebalanced my index portfolio today. Boring is a feature, not a bug.',
    'Reading three different takes on the same jobs report. All confident. All different.',
    'The best financial advice I got: automate the boring parts and stop checking every hour.',
  ],
  space: [
    "The Moon looked enormous tonight. Perigee plus low horizon is a great combo.",
    "A reusable booster landed for the 20th time. We take this for granted now.",
    "Exoplanet atmosphere spectra are the most beautiful charts in science. Fight me.",
    'Caught the space station passing overhead tonight. Never gets old.',
    'New telescope images dropped and my desktop wallpaper is updated for the year.',
    'Launch scrubbed for weather again. Space is hard and patience is part of the job.',
    'Teaching my kid the planets with oranges and grapes. Saturn is a bagel, apparently.',
  ],
  climate: [
    "Our school switched to heat pumps and cut energy costs by 40% in one winter.",
    "Community solar is quietly one of the best climate policies at the local level.",
    "The new flood maps for our city are sobering. Zoning meeting is Thursday.",
    'Our city added 12 km of protected bike lanes this year. Ridership doubled.',
    'Planted 40 native trees with neighbors this weekend. Small, local, real.',
    'Heat pump installed. First month bill is in and I am a convert.',
    'Read the latest climate report on the train. Sobering, but full of practical paths.',
  ],
  gaming: [
    "The level design in this indie platformer teaches you every mechanic without a single tutorial screen.",
    "Finished the game on hard mode. The final boss is a masterclass in pattern design.",
    "Couch co-op is back and I am here for it.",
    'Finished an indie game in one sitting. Six hours, zero regrets, one cry.',
    'Speedrun community found a skip that saves four minutes. Absolute wizards.',
    'Accessibility options in new releases keep getting better. More of this please.',
    'Co-op night with friends across three time zones. Gaming is still the best group chat.',
  ],
  design: [
    "We replaced six different button styles with three. Nobody noticed, and that's the point.",
    "Good error messages say what happened, why, and what to do next. Ours now do.",
    "Contrast checker saved us from shipping light grey text on white. Again.",
    'Spent a day removing things from our UI. It finally feels finished.',
    'A design system is a set of decisions you only have to make once.',
    'Tested our onboarding with five people. Found the same confusion five times. Fixing it.',
    'Empty states deserve as much care as full ones. Tell people what to do next.',
  ],
};

const GENERIC = [
  'Can’t stop thinking about #{tag} today. Anyone else following this?',
  'Collected a few great threads on #{tag} this week. Bookmarking all of them.',
  'Hot take on #{tag}: the fundamentals matter more than the headlines.',
  'Joined a local meetup about #{tag}. Lovely people, great conversations.',
];

export function mockPost(hashtag: string, index: number): ContentItem {
  const random = createRandom(`social:${hashtag}:${index}`);
  const templates = POSTS[hashtag] ?? GENERIC;
  const text = (templates[index % templates.length] as string).replaceAll('{tag}', hashtag);
  const author = pick(random, AUTHORS);
  const id = `social:${hashtag}-${index}`;
  const hasImage = random() < 0.5;
  return {
    id,
    type: 'social',
    title: text.length > 90 ? `${text.slice(0, 87).trimEnd()}…` : text,
    summary: text,
    imageUrl: hasImage ? mockImage(id, 640, 360) : null,
    url: `https://x.com/hashtag/${encodeURIComponent(hashtag)}`,
    source: `@${author.handle}`,
    author: author.name,
    publishedAt: new Date(mockNow() - (index * 23 + between(random, 0, 20)) * 60_000).toISOString(),
    category: hashtag,
    tags: [`#${hashtag}`],
    reason: `hashtag:${hashtag}`,
    metrics: { label: 'likes', value: between(random, 3, 12_000) },
  };
}

export function mockSocialPage(hashtags: string[], page: number, pageSize: number) {
  const total = hashtags.length * MOCK_POSTS_PER_HASHTAG;
  const start = (page - 1) * pageSize;
  const items: ContentItem[] = [];
  for (let k = start; k < Math.min(start + pageSize, total); k += 1) {
    const tag = hashtags[k % hashtags.length] as string;
    items.push(mockPost(tag, Math.floor(k / hashtags.length)));
  }
  return { items, hasMore: start + pageSize < total };
}

export function mockSocialCorpus(hashtags: readonly string[], perTag: number): ContentItem[] {
  return hashtags.flatMap((tag) => Array.from({ length: perTag }, (_, index) => mockPost(tag, index)));
}

let liveCounter = 0;

/** A brand-new post for the real-time stream: unique id, timestamped now. */
export function mockLivePost(hashtags: readonly string[]): ContentItem {
  liveCounter += 1;
  const tag = hashtags[liveCounter % hashtags.length] ?? 'webdev';
  const base = mockPost(tag, between(Math.random, 0, MOCK_POSTS_PER_HASHTAG - 1));
  return {
    ...base,
    id: `social:live-${Date.now()}-${liveCounter}`,
    publishedAt: new Date().toISOString(),
    reason: 'live',
    metrics: { label: 'likes', value: 0 },
  };
}
