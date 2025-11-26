import { Metadata } from 'next/types';
import { prisma } from '@/lib/prisma';
import ProvidersClient from '../../admin/providers/ProvidersClient';

export const metadata: Metadata = {
  title: 'Manage Providers - Editor',
};

export default async function EditorProvidersPage() {
  const providersRaw = await prisma.provider.findMany({
    orderBy: { name: 'asc' },
  });

  // Serialize data for client component (convert Dates to strings and Json to plain objects)
  const providers = providersRaw.map(provider => ({
    ...provider,
    createdAt: provider.createdAt.toISOString(),
    updatedAt: provider.updatedAt.toISOString(),
    // Serialize Json fields to plain objects to avoid React error #310
    wikiContent: provider.wikiContent ? JSON.parse(JSON.stringify(provider.wikiContent)) : null,
    preferences: provider.preferences ? JSON.parse(JSON.stringify(provider.preferences)) : null,
  }));

  return <ProvidersClient providers={providers as any} showDelete={false} />;
}
