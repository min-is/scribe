import { Metadata } from 'next/types';
import MedicationsClient from './MedicationsClient';

export const metadata: Metadata = {
  title: 'Medications - Editor',
  description: 'Medication reference and lookup tool',
};

export default async function EditorMedicationsPage() {
  return <MedicationsClient />;
}
