import { Metadata } from 'next/types';
import MedicationsClient from './MedicationsClient';
import { getAllMedications } from '@/medication/actions';

export const metadata: Metadata = {
  title: 'Medications',
  description: 'Medication reference and lookup tool',
};

export default async function MedicationsPage() {
  // Load all medications for client-side fuzzy search
  const medications = await getAllMedications();

  return (
    <MedicationsClient
      allMedications={medications}
    />
  );
}
