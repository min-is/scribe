import { Metadata } from 'next';
import { getMedications } from '@/medication/actions';
import MedicationsClient from './MedicationsClient';

export const metadata: Metadata = {
  title: 'Manage Medications | Scribe Admin',
  description: 'Manage medication library entries',
};

export const dynamic = 'force-dynamic';

export default async function MedicationsPage() {
  const medications = await getMedications();

  return <MedicationsClient medications={medications} />;
}
