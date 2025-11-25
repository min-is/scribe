import { Metadata } from 'next/types';
import MedicationsClient from './MedicationsClient';
import { getMedications, getMedicationsCount } from '@/medication/actions';

export const metadata: Metadata = {
  title: 'Medications',
  description: 'Medication reference and lookup tool',
};

const INITIAL_LIMIT = 50;

export default async function MedicationsPage() {
  // Load initial batch of medications
  const medications = await getMedications({ limit: INITIAL_LIMIT });
  const totalCount = await getMedicationsCount();

  return (
    <MedicationsClient
      initialMedications={medications}
      totalCount={totalCount}
      initialLimit={INITIAL_LIMIT}
    />
  );
}
