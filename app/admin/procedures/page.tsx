import { Metadata } from 'next/types';
import { prisma } from '@/lib/prisma';
import ProceduresAdminClient from './ProceduresAdminClient';

export const metadata: Metadata = {
  title: 'Manage Procedures - Admin',
  description: 'Create, edit, and delete medical procedures',
};

export default async function ProceduresAdminPage() {
  const procedures = await prisma.procedure.findMany({
    orderBy: { title: 'asc' },
  });

  // Get unique categories
  const categories = Array.from(new Set(procedures.map(p => p.category).filter(Boolean))) as string[];

  return (
    <ProceduresAdminClient
      procedures={procedures}
      existingCategories={categories}
    />
  );
}
