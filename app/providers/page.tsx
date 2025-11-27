import { Metadata } from 'next/types';
import { prisma } from '@/lib/prisma';
import ProvidersPageClient from './ProvidersPageClient';

export const metadata: Metadata = {
  title: 'Provider Preferences',
  description:
    'Browse provider documentation preferences and expectations',
};

// Enable Incremental Static Regeneration - revalidate every hour
export const revalidate = 3600;

export default async function ProvidersPage() {
  // Fetch providers with only the fields needed for the list view
  // Excludes large JSON blobs (wikiContent, preferences, noteTemplate, noteSmartPhrase)
  let providersRaw;
  try {
    providersRaw = await prisma.provider.findMany({
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
      take: 200, // Limit to 200 providers (add pagination later if needed)
    });
  } catch (error) {
    // Fallback if Page table doesn't exist yet
    providersRaw = await prisma.provider.findMany({
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
      },
      orderBy: { name: 'asc' },
      take: 200,
    });
  }

  // Serialize data for client component (convert Dates to strings)
  const providers = providersRaw.map(provider => ({
    ...provider,
    createdAt: provider.createdAt.toISOString(),
    updatedAt: provider.updatedAt.toISOString(),
  }));

  return <ProvidersPageClient providers={providers as any} />;
}
