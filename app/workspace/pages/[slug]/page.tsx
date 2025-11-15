import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import TipTapEditor from '@/components/editor/TipTapEditor';
import { Edit, Trash2, Eye } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageViewProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageViewProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await prisma.page.findUnique({
    where: { slug, deletedAt: null },
    select: { title: true },
  });

  return {
    title: page ? page.title : 'Page Not Found',
  };
}

export default async function PageView({ params }: PageViewProps) {
  const { slug } = await params;

  const page = await prisma.page.findUnique({
    where: { slug, deletedAt: null },
    include: {
      parent: true,
      children: {
        where: { deletedAt: null },
        orderBy: { position: 'asc' },
      },
    },
  });

  if (!page) {
    notFound();
  }

  // Increment view count
  await prisma.page.update({
    where: { id: page.id },
    data: { viewCount: { increment: 1 } },
  });

  return (
    <div className="h-full flex flex-col bg-main">
      {/* Page Header */}
      <div className="border-b border-main bg-medium sticky top-0 z-10">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2 text-sm text-dim">
            {page.parent && (
              <>
                <Link
                  href={`/workspace/pages/${page.parent.slug}`}
                  className="hover:text-main transition-colors"
                >
                  {page.parent.title}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-main font-medium">{page.title}</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/workspace/pages/${page.slug}/edit`}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-black rounded-md hover:opacity-90 transition-opacity text-sm"
            >
              <Edit size={16} />
              Edit
            </Link>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-8 px-6">
          {/* Icon and Title */}
          <div className="mb-8">
            {page.icon && (
              <div className="text-6xl mb-4">
                {page.icon}
              </div>
            )}
            <h1 className="text-4xl font-bold text-main mb-2">
              {page.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-dim">
              <span>{page.viewCount} views</span>
              <span>•</span>
              <span>Last updated {new Date(page.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Content */}
          <div className="mb-8">
            <TipTapEditor
              content={page.content}
              editable={false}
            />
          </div>

          {/* Child Pages */}
          {page.children.length > 0 && (
            <div className="mt-12 pt-8 border-t border-main">
              <h2 className="text-2xl font-semibold text-main mb-4">
                Subpages
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {page.children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/workspace/pages/${child.slug}`}
                    className="flex items-start gap-3 p-4 border border-main rounded-lg hover:bg-dim transition-colors"
                  >
                    {child.icon && (
                      <span className="text-2xl">{child.icon}</span>
                    )}
                    <div>
                      <div className="font-semibold text-main">{child.title}</div>
                      <div className="text-sm text-dim mt-1">
                        {child.viewCount} views
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
