import { Metadata } from 'next/types';
import { prisma } from '@/lib/prisma';
import SmartPhrasesAdminClient from './SmartPhrasesAdminClient';

export const metadata: Metadata = {
  title: 'Manage SmartPhrases - Admin',
  description: 'Create, edit, and delete EPIC SmartPhrases',
};

export default async function SmartPhrasesAdminPage() {
  const smartphrases = await prisma.smartPhrase.findMany({
    orderBy: { title: 'asc' },
  });

  // Get unique categories
  const categories = Array.from(new Set(smartphrases.map(s => s.category).filter(Boolean))) as string[];

  return (
    <SmartPhrasesAdminClient
      smartphrases={smartphrases}
      existingCategories={categories}
    />
  );
}
