import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PageViewer } from '@/components/workspace/PageViewer';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await prisma.page.findUnique({
    where: { slug, deletedAt: null },
    select: { title: true },
  });

  return {
    title: page?.title || 'Page Not Found',
  };
}

export default async function PageViewPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await prisma.page.findUnique({
    where: { slug, deletedAt: null },
    include: {
      parent: {
        select: { id: true, title: true, slug: true, icon: true },
      },
      children: {
        where: { deletedAt: null },
        select: { id: true, title: true, slug: true, icon: true, type: true },
        orderBy: { position: 'asc' },
      },
    },
  });

  if (!page) {
    notFound();
  }

  return <PageViewer page={page} />;
}
