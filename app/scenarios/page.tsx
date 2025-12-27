import { Metadata } from 'next/types';
import ScenariosPageClient from './ScenariosPageClient';
import { getScenarios } from '@/scenario/actions';

export const metadata: Metadata = {
  title: 'Scenarios',
  description:
    'Browse clinical scenario walkthroughs for ED events',
};

export default async function ScenariosPage() {
  // Fetch all scenarios with content for instant modal display
  const scenariosRaw = await getScenarios();

  // Serialize data for client component (convert Dates to strings, Json to plain objects)
  const scenarios = scenariosRaw.map(scenario => ({
    ...scenario,
    createdAt: scenario.createdAt instanceof Date
      ? scenario.createdAt.toISOString()
      : scenario.createdAt,
    updatedAt: scenario.updatedAt instanceof Date
      ? scenario.updatedAt.toISOString()
      : scenario.updatedAt,
    content: scenario.content ? JSON.parse(JSON.stringify(scenario.content)) : null,
  }));

  // Get unique categories
  const categories = Array.from(new Set(scenarios.map(s => s.category).filter(Boolean))) as string[];

  return <ScenariosPageClient scenarios={scenarios} categories={categories} />;
}
