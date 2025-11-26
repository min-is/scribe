import { Metadata } from 'next/types';
import { prisma } from '@/lib/prisma';
import ProvidersClient from './ProvidersClient';

export const metadata: Metadata = {
  title: 'Manage Providers - Admin',
};

export default async function ProvidersPage() {
  const providersRaw = await prisma.provider.findMany({
    orderBy: { name: 'asc' },
  });

  // Serialize data for client component (convert Dates to strings)
  const providers = providersRaw.map(provider => ({
    ...provider,
    createdAt: provider.createdAt.toISOString(),
    updatedAt: provider.updatedAt.toISOString(),
  }));

  return <ProvidersClient providers={providers as any} />;
}
