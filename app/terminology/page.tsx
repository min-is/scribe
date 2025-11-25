import { Metadata } from 'next/types';
import TerminologyClient from './TerminologyClient';
import { getTerminologies } from '@/terminology/actions';

export const metadata: Metadata = {
  title: 'Medical Terminology',
  description: 'Medical terminology reference guide',
};

export default async function TerminologyPage() {
  const terminologies = await getTerminologies();

  return <TerminologyClient terminologies={terminologies} />;
}
