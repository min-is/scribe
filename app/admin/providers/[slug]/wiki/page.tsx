import { getProviderBySlug } from '@/provider/actions';
import { WikiEditorClient } from './WikiEditorClient';
import { notFound } from 'next/navigation';

export default async function WikiEditorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const provider = await getProviderBySlug(slug);

  if (!provider) {
    notFound();
  }

  return <WikiEditorClient provider={provider} />;
}
