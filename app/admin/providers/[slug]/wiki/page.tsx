import { getProviderBySlug } from '@/provider/actions';
import { WikiEditorClient } from './WikiEditorClient';
import { notFound } from 'next/navigation';

export default async function WikiEditorPage({
  params,
}: {
  params: { slug: string };
}) {
  const provider = await getProviderBySlug(params.slug);

  if (!provider) {
    notFound();
  }

  return <WikiEditorClient provider={provider} />;
}
