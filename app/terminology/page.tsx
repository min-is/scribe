import { Metadata } from 'next/types';
import TerminologyClient from './TerminologyClient';

export const metadata: Metadata = {
  title: 'Medical Terminology',
  description: 'Medical terminology reference guide',
};

export default async function TerminologyPage() {
  return <TerminologyClient />;
}
