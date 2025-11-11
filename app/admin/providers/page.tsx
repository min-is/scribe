import { Metadata } from 'next/types';
import { getProviders } from '@/provider/actions';
import ProvidersClient from './ProvidersClient';

export const metadata: Metadata = {
  title: 'Manage Providers - Admin',
};

export default async function ProvidersPage() {
  const providers = await getProviders();

  return <ProvidersClient providers={providers} />;
}
