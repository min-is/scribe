import { Metadata } from 'next/types';
import { prisma } from '@/lib/prisma';
import ProceduresAdminClient from '@/admin/procedures/ProceduresAdminClient';

export const metadata: Metadata = {
  title: 'Manage Procedures - Editor',
  description: 'Create and edit medical procedures',
};

export default async function EditorProceduresPage() {
  const procedures = await prisma.procedure.findMany({
    orderBy: { title: 'asc' },
  });

  // Get unique categories
  const categories = Array.from(new Set(procedures.map(p => p.category).filter(Boolean))) as string[];

  return (
    <ProceduresAdminClient
      procedures={procedures}
      existingCategories={categories}
      showDelete={false}
    />
  );
}
