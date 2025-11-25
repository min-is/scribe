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
  let procedures;
  try {
    procedures = await prisma.procedure.findMany({
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
    procedures = await prisma.procedure.findMany({
      orderBy: { title: 'asc' },
    });
  }

  // Get unique categories
  const categories = Array.from(new Set(procedures.map(p => p.category).filter(Boolean))) as string[];

  return (
    <ProceduresPageClient procedures={procedures as any} categories={categories} />
  );
}
