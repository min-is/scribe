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

  // Serialize data for client component (convert Dates to strings)
  const providers = providersRaw.map(provider => ({
    ...provider,
    createdAt: provider.createdAt.toISOString(),
    updatedAt: provider.updatedAt.toISOString(),
  }));

  return <ProvidersPageClient providers={providers as any} />;
}
