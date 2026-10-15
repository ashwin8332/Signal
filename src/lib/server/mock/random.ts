/**
 * Deterministic pseudo-randomness for mock data: the same seed string always
 * produces the same sequence, so pages are stable across requests and tests.
 */

/** FNV-1a 32-bit string hash. */
export function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32 PRNG returning floats in [0, 1). */
export function createRandom(seed: string): () => number {
  let state = hashString(seed);
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(random: () => number, list: readonly T[]): T {
  return list[Math.floor(random() * list.length)] as T;
}

export function between(random: () => number, min: number, max: number): number {
  return Math.floor(min + random() * (max - min + 1));
}

/**
 * Anchor for mock timestamps, rounded to the hour, so "published 3h ago"
 * stays stable within an hour instead of drifting on every request.
 */
export function mockNow(): number {
  return Math.floor(Date.now() / 3_600_000) * 3_600_000;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Stable placeholder photo for an id (https, varied, no API key needed). */
export function mockImage(seed: string, width = 640, height = 360): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}`;
}
