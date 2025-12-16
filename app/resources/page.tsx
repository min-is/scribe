import { Metadata } from 'next/types';
import ResourcesPageClient from './ResourcesPageClient';

export const metadata: Metadata = {
  title: 'Resources',
  description: 'General help and information for scribes',
};

export default async function ResourcesPage() {
  return <ResourcesPageClient />;
}
