import { Metadata } from 'next/types';
import { prisma } from '@/lib/prisma';
import ScenariosAdminClient from '@/admin/scenarios/ScenariosAdminClient';

export const metadata: Metadata = {
  title: 'Manage Scenarios - Editor',
  description: 'Create and edit clinical scenarios',
};

export default async function EditorScenariosPage() {
  const scenarios = await prisma.scenario.findMany({
    orderBy: { title: 'asc' },
  });

  // Get unique categories
  const categories = Array.from(new Set(scenarios.map(s => s.category).filter(Boolean))) as string[];

  return (
    <ScenariosAdminClient
      scenarios={scenarios}
      existingCategories={categories}
      showDelete={false}
    />
  );
}
