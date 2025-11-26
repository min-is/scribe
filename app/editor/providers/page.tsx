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

  // Serialize data for client component (convert Dates to strings)
  const providers = providersRaw.map(provider => ({
    ...provider,
    createdAt: provider.createdAt.toISOString(),
    updatedAt: provider.updatedAt.toISOString(),
  }));

  return <ProvidersClient providers={providers as any} showDelete={false} />;
}
