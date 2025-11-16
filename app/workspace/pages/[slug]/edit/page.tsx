import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import PageEditor from '@/components/workspace/PageEditor';

export const dynamic = 'force-dynamic';

interface PageEditProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageEditProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await prisma.page.findUnique({
    where: { slug, deletedAt: null },
    select: { title: true },
  });

  return {
    title: page ? `Edit: ${page.title}` : 'Page Not Found',
  };
}

export default async function PageEditRoute({ params }: PageEditProps) {
  const { slug } = await params;

  const page = await prisma.page.findUnique({
    where: { slug, deletedAt: null },
    include: {
      parent: true,
    },
  });

  if (!page) {
    notFound();
  }

  return <PageEditor page={page} />;
}
