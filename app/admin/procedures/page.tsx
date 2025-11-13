import { Metadata } from 'next/types';
import { getProcedures, getProcedureCategories } from '@/procedure/actions';
import ProceduresAdminClient from './ProceduresAdminClient';

export const metadata: Metadata = {
  title: 'Manage Procedures - Admin',
  description: 'Create, edit, and delete medical procedures',
};

export default async function ProceduresAdminPage() {
  const [procedures, categories] = await Promise.all([
    getProcedures(),
    getProcedureCategories(),
  ]);

  return (
    <ProceduresAdminClient
      procedures={procedures}
      existingCategories={categories}
    />
  );
}
