import { Metadata } from 'next/types';
import { getPhysicians } from '@/physician';
import PhysiciansClient from './PhysiciansClient';

export const metadata: Metadata = {
  title: 'Manage Physicians - Admin',
};

export default async function PhysiciansPage() {
  const physicians = await getPhysicians();

  return <PhysiciansClient physicians={physicians} />;
}
