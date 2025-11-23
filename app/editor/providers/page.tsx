import { Metadata } from 'next/types';
import { prisma } from '@/lib/prisma';
import ProvidersClient from '../../admin/providers/ProvidersClient';

export const metadata: Metadata = {
  title: 'Manage Providers - Editor',
};

export default async function EditorProvidersPage() {
  const providers = await prisma.provider.findMany({
    orderBy: { name: 'asc' },
  });

  return <ProvidersClient providers={providers} showDelete={false} />;
}
