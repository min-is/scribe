import { Metadata } from 'next/types';
import MedicationsClient from './MedicationsClient';
import { getMedications } from '@/medication/actions';

export const metadata: Metadata = {
  title: 'Medications',
  description: 'Medication reference and lookup tool',
};

export default async function MedicationsPage() {
  const medications = await getMedications();

  return <MedicationsClient medications={medications} />;
}
