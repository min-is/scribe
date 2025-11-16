import { Metadata } from 'next/types';
import { prisma } from '@/lib/prisma';
import ScenariosPageClient from './ScenariosPageClient';

export const metadata: Metadata = {
  title: 'Clinical Scenarios - Medical Scribe Dashboard',
  description:
    'Browse clinical scenario walkthroughs for emergency and routine medical situations',
};

export default async function ScenariosPage() {
  // Fetch scenarios with their associated pages
  const scenarios = await prisma.scenario.findMany({
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
  const categories = Array.from(new Set(scenarios.map(s => s.category).filter(Boolean))) as string[];

  return <ScenariosPageClient scenarios={scenarios} categories={categories} />;
}
