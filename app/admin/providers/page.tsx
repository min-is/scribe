import { Metadata } from 'next/types';
import { prisma } from '@/lib/prisma';
import ProvidersClient from './ProvidersClient';

export const metadata: Metadata = {
  title: 'Manage Providers - Admin',
};

export default async function ProvidersPage() {
  const providers = await prisma.provider.findMany({
    orderBy: { name: 'asc' },
  });

  return <ProvidersClient providers={providers} />;
}
