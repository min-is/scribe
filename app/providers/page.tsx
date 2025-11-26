import { Metadata } from 'next/types';
import { prisma } from '@/lib/prisma';
import ProvidersPageClient from './ProvidersPageClient';

export const metadata: Metadata = {
  title: 'Provider Preferences',
  description:
    'Browse provider documentation preferences and expectations',
};

export default async function ProvidersPage() {
  // Fetch providers with their associated pages (if table exists)
  let providersRaw;
  try {
    providersRaw = await prisma.provider.findMany({
      orderBy: { name: 'asc' },
      include: {
        page: {
          select: {
            slug: true,
          },
        },
      },
    });
  } catch (error) {
    // Fallback if Page table doesn't exist yet
    providersRaw = await prisma.provider.findMany({
      orderBy: { name: 'asc' },
    });
  }

  // Serialize data for client component (convert Dates to strings and Json to plain objects)
  const providers = providersRaw.map(provider => ({
    ...provider,
    createdAt: provider.createdAt.toISOString(),
    updatedAt: provider.updatedAt.toISOString(),
    // Serialize Json fields to plain objects to avoid React error #310
    wikiContent: provider.wikiContent ? JSON.parse(JSON.stringify(provider.wikiContent)) : null,
    preferences: provider.preferences ? JSON.parse(JSON.stringify(provider.preferences)) : null,
  }));

  return <ProvidersPageClient providers={providers as any} />;
}
