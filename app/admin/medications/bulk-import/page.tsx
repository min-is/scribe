import { Metadata } from 'next';
import BulkImportClient from './BulkImportClient';

export const metadata: Metadata = {
  title: 'Bulk Import Medications | Scribe Admin',
  description: 'Bulk import medication data from CSV or external sources',
};

export default function BulkImportPage() {
  return <BulkImportClient />;
}
