import { Metadata } from 'next/types';
import ResourcesPageClient from './ResourcesPageClient';
import { getResourceTree } from '@/resource/actions';

export const metadata: Metadata = {
  title: 'Resources',
  description: 'General help and information for scribes',
};

export default async function ResourcesPage() {
  const sections = await getResourceTree();

  return <ResourcesPageClient sections={sections} />;
}
