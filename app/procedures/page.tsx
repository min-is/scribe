import { Metadata } from 'next/types';
import { prisma } from '@/lib/prisma';
import ProceduresPageClient from './ProceduresPageClient';

export const metadata: Metadata = {
  title: 'Procedures',
  description:
    'Browse step-by-step guides for documenting ED procedures',
};

export default async function ProceduresPage() {
  // Fetch procedures with their associated pages (if table exists)
  let proceduresRaw;
  try {
    proceduresRaw = await prisma.procedure.findMany({
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
    proceduresRaw = await prisma.procedure.findMany({
      orderBy: { title: 'asc' },
    });
  }

  // Serialize data for client component (convert Dates to strings and Json to plain objects)
  const procedures = proceduresRaw.map(procedure => ({
    ...procedure,
    createdAt: procedure.createdAt.toISOString(),
    updatedAt: procedure.updatedAt.toISOString(),
    // Serialize Json fields to plain objects to avoid React error #310
    steps: procedure.steps ? JSON.parse(JSON.stringify(procedure.steps)) : null,
  }));

  // Get unique categories
  const categories = Array.from(new Set(procedures.map(p => p.category).filter(Boolean))) as string[];

  return (
    <ProceduresPageClient procedures={procedures as any} categories={categories} />
  );
}
