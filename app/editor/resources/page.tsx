import { Metadata } from 'next/types';
import ResourcesEditorClient from './ResourcesEditorClient';
import { getResourceTree } from '@/resource/actions';

export const metadata: Metadata = {
  title: 'Manage Resources - Editor',
  description: 'Manage resource articles',
};

export default async function EditorResourcesPage() {
  const sections = await getResourceTree();

  return <ResourcesEditorClient sections={sections} />;
}
