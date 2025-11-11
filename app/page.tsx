import { Metadata } from 'next/types';
import { META_TITLE, META_DESCRIPTION } from '@/app/config';
import { getPhysicians } from '@/physician';
import HomePageClient from './HomePageClient';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: META_TITLE,
    description: META_DESCRIPTION,
  };
}

export default async function HomePage() {
  const physicians = await getPhysicians();

  return <HomePageClient physicians={physicians} />;
}
