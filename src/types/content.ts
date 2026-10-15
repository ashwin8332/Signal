export type ContentType = 'news' | 'movie' | 'social';

export interface ContentMetric {
  label: 'rating' | 'likes' | 'reads';
  value: number;
}

/** One normalized piece of content, whichever provider it came from. */
export interface ContentItem {
  /** Globally unique and prefixed by type, e.g. `news:technology-1-3`. */
  id: string;
  type: ContentType;
  title: string;
  summary: string;
  /** Always https, or null when the provider had no usable image. */
  imageUrl: string | null;
  /** Always https. */
  url: string;
  source: string;
  author: string | null;
  /** ISO-8601 timestamp. */
  publishedAt: string;
  category: string;
  tags: string[];
  /** Machine-readable reason, e.g. `category:technology`, `genre:drama`, `hashtag:ai`, `trending`, `search`. */
  reason: string;
  metrics: ContentMetric | null;
}

export interface PageResponse {
  items: ContentItem[];
  page: number;
  hasMore: boolean;
  source: 'live' | 'mock';
}

export interface SearchResponse extends PageResponse {
  failedSources: ContentType[];
}

export interface TrendingResponse {
  items: ContentItem[];
}

export interface FeedPage {
  items: ContentItem[];
  page: number;
  hasMore: boolean;
  failedSources: ContentType[];
  /** Where each enabled source's data came from: a real API or demo data. */
  sources: Partial<Record<ContentType, 'live' | 'mock'>>;
}

export interface ApiErrorBody {
  error: { code: string; message: string };
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
}
