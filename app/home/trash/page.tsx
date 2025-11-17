import { Metadata } from 'next';
import TrashView from '@/components/workspace/TrashView';

export const metadata: Metadata = {
  title: 'Trash | Scribe Home',
  description: 'Deleted pages',
};

export default function TrashPage() {
  return <TrashView />;
}
