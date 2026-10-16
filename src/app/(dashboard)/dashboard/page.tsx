import type { Metadata } from 'next';
import { FeedView } from '@/components/feed/FeedView';

export const metadata: Metadata = { title: 'Your briefing' };

export default function FeedPage() {
  return <FeedView />;
}
