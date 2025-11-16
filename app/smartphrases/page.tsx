import { Metadata } from 'next/types';
import { prisma } from '@/lib/prisma';
import SmartPhrasesPageClient from './SmartPhrasesPageClient';

export const metadata: Metadata = {
  title: 'SmartPhrase Library - Medical Scribe Dashboard',
  description:
    'Browse and search EPIC SmartPhrases (.phrases) for clinical documentation',
};

export default async function SmartPhrasesPage() {
  // Fetch smartphrases with their associated pages
  const smartphrases = await prisma.smartPhrase.findMany({
    orderBy: { title: 'asc' },
    include: {
      page: {
        select: {
          slug: true,
        },
      },
    },
  });

  // Get unique categories
  const categories = Array.from(new Set(smartphrases.map(s => s.category).filter(Boolean))) as string[];

  return (
    <SmartPhrasesPageClient
      smartphrases={smartphrases}
      categories={categories}
    />
  );
}
