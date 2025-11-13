import { Metadata } from 'next/types';
import { getSmartPhrases, getCategories } from '@/smartphrase/actions';
import SmartPhrasesAdminClient from './SmartPhrasesAdminClient';

export const metadata: Metadata = {
  title: 'Manage SmartPhrases - Admin',
  description: 'Create, edit, and delete EPIC SmartPhrases',
};

export default async function SmartPhrasesAdminPage() {
  const [smartphrases, categories] = await Promise.all([
    getSmartPhrases(),
    getCategories(),
  ]);

  return (
    <SmartPhrasesAdminClient
      smartphrases={smartphrases}
      existingCategories={categories}
    />
  );
}
