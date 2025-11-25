import { Metadata } from 'next/types';
import { prisma } from '@/lib/prisma';
import SmartPhrasesPageClient from './SmartPhrasesPageClient';

export const metadata: Metadata = {
  title: 'SmartPhrase Library',
  description:
    'Browse and search for EPIC SmartPhrases (.phrases) for documentation efficiency',
};

export default async function SmartPhrasesPage() {
  // Fetch smartphrases with their associated pages (if table exists)
  let smartphrases;
  try {
    smartphrases = await prisma.smartPhrase.findMany({
      orderBy: { title: 'asc' },
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
    smartphrases = await prisma.smartPhrase.findMany({
      orderBy: { title: 'asc' },
    });
  }

  // Get unique categories
  const categories = Array.from(new Set(smartphrases.map(s => s.category).filter(Boolean))) as string[];

  return (
    <SmartPhrasesPageClient
      smartphrases={smartphrases as any}
      categories={categories}
    />
  );
}
