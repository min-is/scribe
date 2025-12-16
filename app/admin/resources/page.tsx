import { Metadata } from 'next/types';
import ResourcesAdminClient from './ResourcesAdminClient';
import { getResourceTree } from '@/resource/actions';

export const metadata: Metadata = {
  title: 'Manage Resources - Admin',
  description: 'Manage resource sections and articles',
};

export default async function AdminResourcesPage() {
  const sections = await getResourceTree();

  return <ResourcesAdminClient sections={sections} />;
}
