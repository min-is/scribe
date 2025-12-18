import { Metadata } from 'next/types';
import ScenariosPageClient from './ScenariosPageClient';
import { getScenariosForList } from '@/scenario/actions';

export const metadata: Metadata = {
  title: 'Scenarios',
  description:
    'Browse clinical scenario walkthroughs for ED events',
};

// Revalidate every 60 seconds for fresh data with caching benefits
export const revalidate = 60;

export default async function ScenariosPage() {
  // Fetch scenarios without content field for faster loading
  const scenariosRaw = await getScenariosForList();

  // Serialize data for client component (convert Dates to strings)
  const scenarios = scenariosRaw.map(scenario => ({
    ...scenario,
    createdAt: scenario.createdAt instanceof Date
      ? scenario.createdAt.toISOString()
      : scenario.createdAt,
    updatedAt: scenario.updatedAt instanceof Date
      ? scenario.updatedAt.toISOString()
      : scenario.updatedAt,
  }));

  // Get unique categories
  const categories = Array.from(new Set(scenarios.map(s => s.category).filter(Boolean))) as string[];

  return <ScenariosPageClient scenarios={scenarios} categories={categories} />;
}
