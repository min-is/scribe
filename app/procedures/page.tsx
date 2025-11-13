import { Metadata } from 'next/types';
import { getProcedures, getProcedureCategories } from '@/procedure/actions';
import ProceduresPageClient from './ProceduresPageClient';

export const metadata: Metadata = {
  title: 'Medical Procedures - Medical Scribe Dashboard',
  description:
    'Browse step-by-step guides for medical procedures with indications, contraindications, and equipment',
};

export default async function ProceduresPage() {
  const [procedures, categories] = await Promise.all([
    getProcedures(),
    getProcedureCategories(),
  ]);

  return (
    <ProceduresPageClient procedures={procedures} categories={categories} />
  );
}
