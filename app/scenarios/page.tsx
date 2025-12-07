import { Metadata } from 'next/types';
import { prisma } from '@/lib/prisma';
import ScenariosPageClient from './ScenariosPageClient';

export const metadata: Metadata = {
  title: 'Scenarios',
  description:
    'Browse clinical scenario walkthroughs for ED events',
};

// Force dynamic rendering to prevent caching stale data
export const dynamic = 'force-dynamic';

export default async function ScenariosPage() {
  // Fetch scenarios with their associated pages (if table exists)
  let scenariosRaw;
  try {
    scenariosRaw = await prisma.scenario.findMany({
      orderBy: { title: 'asc' },
      include: {
        page: {
          select: {
            slug: true,
          },
        },
      },
    });
  } catch (error) {
    // Fallback if Page table doesn't exist yet
    scenariosRaw = await prisma.scenario.findMany({
      orderBy: { title: 'asc' },
    });
  }

  // Serialize data for client component (convert Dates to strings and Json to plain objects)
  const scenarios = scenariosRaw.map(scenario => ({
    ...scenario,
    createdAt: scenario.createdAt.toISOString(),
    updatedAt: scenario.updatedAt.toISOString(),
    // Serialize Json fields to plain objects to avoid React error #310
    content: scenario.content ? JSON.parse(JSON.stringify(scenario.content)) : null,
  }));

  // Get unique categories
  const categories = Array.from(new Set(scenarios.map(s => s.category).filter(Boolean))) as string[];

  return <ScenariosPageClient scenarios={scenarios as any} categories={categories} />;
}
