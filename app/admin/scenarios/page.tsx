import { Metadata } from 'next/types';
import { getScenarios, getScenarioCategories } from '@/scenario/actions';
import ScenariosAdminClient from './ScenariosAdminClient';

export const metadata: Metadata = {
  title: 'Manage Scenarios - Admin',
  description: 'Create, edit, and delete clinical scenarios',
};

export default async function ScenariosAdminPage() {
  const [scenarios, categories] = await Promise.all([
    getScenarios(),
    getScenarioCategories(),
  ]);

  return (
    <ScenariosAdminClient
      scenarios={scenarios}
      existingCategories={categories}
    />
  );
}
