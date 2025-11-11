import { Metadata } from 'next/types';
import { getProviders } from '@/provider/actions';
import ProvidersPageClient from './ProvidersPageClient';

export const metadata: Metadata = {
  title: 'Provider Preferences - Medical Scribe Dashboard',
  description:
    'Browse provider profiles, preferences, and difficulty ratings for medical scribes',
};

export default async function ProvidersPage() {
  const providers = await getProviders();

  return <ProvidersPageClient providers={providers} />;
}
