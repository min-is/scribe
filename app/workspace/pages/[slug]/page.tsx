import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import TipTapEditor from '@/components/editor/TipTapEditor';
import { Edit, Trash2, Eye } from 'lucide-react';
import { PageViewTracker } from '@/components/pages/PageViewTracker';
import { cache } from 'react';

export const dynamic = 'force-dynamic';

interface PageViewProps {
  params: Promise<{ slug: string }>;
}

// Cache the page fetch to avoid duplicate queries between metadata and page
const getPage = cache(async (slug: string) => {
  return await prisma.page.findUnique({
    where: { slug, deletedAt: null },
    select: {
      id: true,
      slug: true,
      title: true,
      content: true,
      icon: true,
      viewCount: true,
      updatedAt: true,
      parent: {
        select: {
          slug: true,
          title: true,
        },
      },
      children: {
        where: { deletedAt: null },
        orderBy: { position: 'asc' },
        select: {
          id: true,
          slug: true,
          title: true,
          icon: true,
          viewCount: true,
        },
      },
    },
  });
});

export async function generateMetadata({ params }: PageViewProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);

  return {
    title: page ? page.title : 'Page Not Found',
  };
}

export default async function PageView({ params }: PageViewProps) {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page) {
    notFound();
  }

  // Extract TipTap content from old wiki format if needed
  let displayContent = page.content;

  // Check if content is in old wiki format with sections
  if (typeof displayContent === 'object' && displayContent !== null) {
    const contentObj = displayContent as any;

    // Old format: { sections: [...], metadata: {...}, media: [...] }
    if (contentObj.sections && Array.isArray(contentObj.sections)) {
      if (contentObj.sections.length > 0) {
        // Has sections - extract first section content
        const firstSection = contentObj.sections[0];
        if (firstSection.content && firstSection.content.type === 'doc') {
          displayContent = firstSection.content;
        }
      } else {
        // Empty sections - create empty TipTap document
        displayContent = {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [],
            },
          ],
        };
      }
    }
    // Migration format: stringified JSON in a paragraph
    else if (contentObj.type === 'doc' && contentObj.content && Array.isArray(contentObj.content)) {
      const firstNode = contentObj.content[0];
      if (firstNode?.type === 'paragraph' && firstNode.content?.[0]?.text) {
        const text = firstNode.content[0].text;
        // Try to parse as JSON if it looks like the old wiki format
        if (text.startsWith('{') && text.includes('sections')) {
          try {
            const parsed = JSON.parse(text);
            if (parsed.sections && Array.isArray(parsed.sections) && parsed.sections.length > 0) {
              const firstSection = parsed.sections[0];
              if (firstSection.content && firstSection.content.type === 'doc') {
                displayContent = firstSection.content;
              }
            }
          } catch {
            // Keep original content if parsing fails
          }
        }
      }
    }
  }

  return (
    <div className="h-full flex flex-col bg-main">
      {/* Track page view asynchronously */}
      <PageViewTracker pageId={page.id} />

      {/* Page Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-12 px-8">
          {/* Icon and Title */}
          <div className="mb-10">
            {page.icon && (
              <div className="text-7xl mb-6">
                {page.icon}
              </div>
            )}
            <h1 className="text-5xl font-bold text-main mb-4 tracking-tight leading-tight">
              {page.title}
            </h1>
            <div className="flex items-center gap-3 text-sm text-medium">
              <div className="flex items-center gap-1.5">
                <Eye size={14} />
                <span>{page.viewCount} views</span>
              </div>
              <span className="text-dim">•</span>
              <span>Last updated {new Date(page.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Content */}
          <div className="mb-12 prose-body">
            <TipTapEditor
              content={displayContent}
              editable={false}
              className="prose-body"
            />
          </div>

          {/* Child Pages */}
          {page.children.length > 0 && (
            <div className="mt-16 pt-8 border-t border-main">
              <h2 className="text-xl font-semibold text-main mb-6 prose-headings">
                Subpages in {page.title}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {page.children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/workspace/pages/${child.slug}`}
                    className="group flex items-start gap-3 p-5 border border-main rounded-xl hover:shadow-soft hover:border-primary/50 transition-all bg-main"
                  >
                    {child.icon && (
                      <span className="text-3xl flex-shrink-0">{child.icon}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-main group-hover:text-primary transition-colors mb-1">
                        {child.title}
                      </div>
                      <div className="text-sm text-dim flex items-center gap-1.5">
                        <Eye size={12} />
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
