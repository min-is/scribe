import { Metadata } from 'next/types';
import { prisma } from '@/lib/prisma';
import SmartPhrasesAdminClient from '../../admin/smartphrases/SmartPhrasesAdminClient';

export const metadata: Metadata = {
  title: 'Manage SmartPhrases - Editor',
  description: 'Create and edit EPIC SmartPhrases',
};

export default async function EditorSmartPhrasesPage() {
  const smartphrases = await prisma.smartPhrase.findMany({
    orderBy: { title: 'asc' },
  });

  // Get unique categories
  const categories = Array.from(new Set(smartphrases.map(s => s.category).filter(Boolean))) as string[];

  return (
    <SmartPhrasesAdminClient
      smartphrases={smartphrases}
      existingCategories={categories}
      showDelete={false}
    />
  );
}
