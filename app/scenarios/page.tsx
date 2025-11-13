import { Metadata } from 'next/types';
import { getScenarios, getScenarioCategories } from '@/scenario/actions';
import ScenariosPageClient from './ScenariosPageClient';

export const metadata: Metadata = {
  title: 'Clinical Scenarios - Medical Scribe Dashboard',
  description:
    'Browse clinical scenario walkthroughs for emergency and routine medical situations',
};

export default async function ScenariosPage() {
  const [scenarios, categories] = await Promise.all([
    getScenarios(),
    getScenarioCategories(),
  ]);

  return <ScenariosPageClient scenarios={scenarios} categories={categories} />;
}
