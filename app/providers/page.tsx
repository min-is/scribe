import { Metadata } from 'next/types';
import { prisma } from '@/lib/prisma';
import ProvidersPageClient from './ProvidersPageClient';

export const metadata: Metadata = {
  title: 'Provider Preferences',
  description:
    'Browse provider documentation preferences and expectations',
};

// Enable Incremental Static Regeneration - revalidate every 1 hour
export const revalidate = 3600;

export default async function ProvidersPage() {
  // Fetch providers with only the fields needed for the list view
  // Exclude large JSON fields (wikiContent, preferences, noteTemplate, noteSmartPhrase)
  // to reduce database load and improve performance
  const providersRaw = await prisma.provider.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      credentials: true,
      icon: true,
      generalDifficulty: true,
      viewCount: true,
      createdAt: true,
      updatedAt: true,
      page: {
        select: {
          slug: true,
        },
      },
    },
    orderBy: { name: 'asc' },
    take: 200, // Limit to 200 providers for now (can add pagination later)
  });

  // Serialize data for client component (convert Dates to strings)
  const providers = providersRaw.map(provider => ({
    ...provider,
    createdAt: provider.createdAt.toISOString(),
    updatedAt: provider.updatedAt.toISOString(),
  }));

  return <ProvidersPageClient providers={providers as any} />;
}
