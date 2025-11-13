import { Metadata } from 'next/types';
import { getSmartPhrases, getCategories } from '@/smartphrase/actions';
import SmartPhrasesPageClient from './SmartPhrasesPageClient';

export const metadata: Metadata = {
  title: 'SmartPhrase Library - Medical Scribe Dashboard',
  description:
    'Browse and search EPIC SmartPhrases (.phrases) for clinical documentation',
};

export default async function SmartPhrasesPage() {
  const [smartphrases, categories] = await Promise.all([
    getSmartPhrases(),
    getCategories(),
  ]);

  return (
    <SmartPhrasesPageClient
      smartphrases={smartphrases}
      categories={categories}
    />
  );
}
