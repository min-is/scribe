import { Metadata } from 'next/types';
import { prisma } from '@/lib/prisma';
import ProvidersPageClient from './ProvidersPageClient';

export const metadata: Metadata = {
  title: 'Provider Preferences',
  description:
    'Browse provider documentation preferences and expectations',
};

export default async function ProvidersPage() {
  // Fetch providers with fields needed for both list view and modal
  // Include page.content for instant modal display (like procedures pattern)
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
      noteSmartPhrase: true,
      page: {
        select: {
          content: true,
        },
      },
    },
    orderBy: { name: 'asc' },
    take: 200, // Limit to 200 providers for now (can add pagination later)
  });

  // Serialize data for client component (convert Dates to strings and Json to plain objects)
  const providers = providersRaw.map(provider => ({
    ...provider,
    createdAt: provider.createdAt.toISOString(),
    updatedAt: provider.updatedAt.toISOString(),
    // Serialize Json content to plain object to avoid React error #310
    page: provider.page ? {
      content: provider.page.content ? JSON.parse(JSON.stringify(provider.page.content)) : null,
    } : null,
  }));

  return <ProvidersPageClient providers={providers as any} />;
}
