import { Metadata } from 'next/types';
import { prisma } from '@/lib/prisma';
import DirectoryPageClient from './DirectoryPageClient';

export const metadata: Metadata = {
  title: 'Physician Directory',
  description: 'Search and browse physicians by specialty',
};

// Enable Incremental Static Regeneration - revalidate every 1 hour
export const revalidate = 3600;

export default async function DirectoryPage() {
  // Fetch physicians from the directory
  const physiciansRaw = await prisma.physicianDirectory.findMany({
    orderBy: [{ specialty: 'asc' }, { name: 'asc' }],
    take: 500,
  });

  // Serialize data for client component (convert Dates to strings)
  const physicians = physiciansRaw.map(physician => ({
    ...physician,
    createdAt: physician.createdAt.toISOString(),
    updatedAt: physician.updatedAt.toISOString(),
  }));

  return <DirectoryPageClient physicians={physicians as any} />;
}
