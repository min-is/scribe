import { Metadata } from 'next/types';
import TerminologyClient from './TerminologyClient';
import { getTerminologies } from '@/terminology/actions';

export const metadata: Metadata = {
  title: 'Manage Terminology - Admin',
  description: 'Manage medical terminology entries',
};

export default async function AdminTerminologyPage() {
  const terminologies = await getTerminologies();

  return <TerminologyClient terminologies={terminologies} />;
}
