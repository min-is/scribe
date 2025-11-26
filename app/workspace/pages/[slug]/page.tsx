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
  const pageRaw = await prisma.page.findUnique({
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

  if (!pageRaw) {
    notFound();
  }

  // Serialize data for client component (convert Dates to strings and Json to plain objects)
  const page = {
    ...pageRaw,
    createdAt: pageRaw.createdAt.toISOString(),
    updatedAt: pageRaw.updatedAt.toISOString(),
    deletedAt: pageRaw.deletedAt ? pageRaw.deletedAt.toISOString() : null,
    // Serialize Json fields to plain objects to avoid React error #310
    content: pageRaw.content ? JSON.parse(JSON.stringify(pageRaw.content)) : null,
    children: pageRaw.children.map(child => ({
      ...child,
      createdAt: child.createdAt.toISOString(),
      updatedAt: child.updatedAt.toISOString(),
      deletedAt: child.deletedAt ? child.deletedAt.toISOString() : null,
      content: child.content ? JSON.parse(JSON.stringify(child.content)) : null,
    })),
    parent: pageRaw.parent ? {
      ...pageRaw.parent,
      createdAt: pageRaw.parent.createdAt.toISOString(),
      updatedAt: pageRaw.parent.updatedAt.toISOString(),
      deletedAt: pageRaw.parent.deletedAt ? pageRaw.parent.deletedAt.toISOString() : null,
      content: pageRaw.parent.content ? JSON.parse(JSON.stringify(pageRaw.parent.content)) : null,
    } : null,
  };

  return <PageViewer page={page} />;
}
