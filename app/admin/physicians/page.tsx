import { Metadata } from 'next';
import { getPhysicianDirectories } from '@/physician-directory/actions';
import PhysiciansClient from './PhysiciansClient';

export const metadata: Metadata = {
  title: 'Manage Physicians | Scribe Admin',
  description: 'Manage physician directory entries',
};

export const dynamic = 'force-dynamic';

export default async function PhysiciansPage() {
  const physicians = await getPhysicianDirectories();

  return <PhysiciansClient physicians={physicians} />;
}
