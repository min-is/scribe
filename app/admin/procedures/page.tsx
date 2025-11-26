import { Metadata } from 'next/types';
import { prisma } from '@/lib/prisma';
import ProceduresAdminClient from './ProceduresAdminClient';

export const metadata: Metadata = {
  title: 'Manage Procedures - Admin',
  description: 'Create, edit, and delete medical procedures',
};

export default async function ProceduresAdminPage() {
  const proceduresRaw = await prisma.procedure.findMany({
    orderBy: { title: 'asc' },
  });

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
    <ProceduresAdminClient
      procedures={procedures as any}
      existingCategories={categories}
    />
  );
}
