import type { Metadata } from 'next';
import { LandingPage } from '@/components/landing/LandingPage';

export const metadata: Metadata = {
  title: 'Signal: the whole world, one briefing',
  description:
    'Live news, film recommendations and the social conversations you follow, in one personalized dashboard you control.',
};

export default function HomePage() {
  return <LandingPage />;
}
