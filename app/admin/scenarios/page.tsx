import { Metadata } from 'next/types';
import { prisma } from '@/lib/prisma';
import ScenariosAdminClient from './ScenariosAdminClient';

export const metadata: Metadata = {
  title: 'Manage Scenarios - Admin',
  description: 'Create, edit, and delete clinical scenarios',
};

export default async function ScenariosAdminPage() {
  const scenarios = await prisma.scenario.findMany({
    orderBy: { title: 'asc' },
  });

  // Get unique categories
  const categories = Array.from(new Set(scenarios.map(s => s.category).filter(Boolean))) as string[];

  return (
    <ScenariosAdminClient
      scenarios={scenarios}
      existingCategories={categories}
    />
  );
}
