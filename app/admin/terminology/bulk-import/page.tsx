import { Metadata } from 'next';
import BulkImportClient from './BulkImportClient';

export const metadata: Metadata = {
  title: 'Bulk Import Terminology | Scribe Admin',
  description: 'Bulk import medical terminology data from CSV',
};

export default function BulkImportPage() {
  return <BulkImportClient />;
}
