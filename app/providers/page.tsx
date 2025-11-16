import { Metadata } from 'next/types';
import { prisma } from '@/lib/prisma';
import ProvidersPageClient from './ProvidersPageClient';

export const metadata: Metadata = {
  title: 'Provider Preferences - Medical Scribe Dashboard',
  description:
    'Browse provider profiles, preferences, and difficulty ratings for medical scribes',
};

export default async function ProvidersPage() {
  // Fetch providers with their associated pages
  const providers = await prisma.provider.findMany({
    orderBy: { name: 'asc' },
    include: {
      page: {
        select: {
          slug: true,
        },
      },
    },
  });

  return <ProvidersPageClient providers={providers} />;
}
