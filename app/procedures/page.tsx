import { Metadata } from 'next/types';
import { prisma } from '@/lib/prisma';
import ProceduresPageClient from './ProceduresPageClient';

export const metadata: Metadata = {
  title: 'Medical Procedures - Medical Scribe Dashboard',
  description:
    'Browse step-by-step guides for medical procedures with indications, contraindications, and equipment',
};

export default async function ProceduresPage() {
  // Fetch procedures with their associated pages
  const procedures = await prisma.procedure.findMany({
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
  const categories = Array.from(new Set(procedures.map(p => p.category).filter(Boolean))) as string[];

  return (
    <ProceduresPageClient procedures={procedures} categories={categories} />
  );
}
